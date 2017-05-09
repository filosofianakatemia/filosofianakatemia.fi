import { ArraySlice, getSliceOfArrayWithRemaining, Info, Utils } from "extendedmind-siteutils";
import * as Router from "koa-router";

interface BlogContext {
  blogs: any;
  remaining?: number;
}

export class Routing {
  private router = new Router();
  private POSTS_PER_PAGE: number = 5;

  constructor(private backendClient: Utils,
              private backendInfo: Info) {
    // SETUP router
    this.router.get("/", this.index);
    this.router.get("/palvelut", this.palvelut);
    this.router.get("/palvelut/sisaisen-motivaation-johtaminen", this.sisaisenMotivaationJohtaminen);
    this.router.get("/palvelut/ajattelunhallinta", this.ajattelunhallinta);
    this.router.get("/ihmiset", this.ihmiset);
    this.router.get("/tutkimus", this.tutkimus);
    this.router.get("/kyselyt/motivoivin-esimies", this.motivoivinEsimies);
    this.router.get("/blogi", this.blogi);
    this.router.get("/blogi/:blogPath", this.blogiTeksti);
    this.router.get("/esikatselu/:ownerUUID/:itemUUID/:previewCode", this.preview);
      /*
    this.router.get("/ihmiset/emilia", this.emilia));
    this.router.get("/ihmiset/frank", this.frank);
    this.router.get("/ihmiset/iida", this.iida);
    this.router.get("/ihmiset/joonas", this.joonas);
    this.router.get("/ihmiset/jp", this.jp);
    this.router.get("/ihmiset/karoliina", this.karoliina);
    this.router.get("/ihmiset/lauri", this.lauri);
    this.router.get("/ihmiset/maija", this.maija);
    this.router.get("/ihmiset/maria", this.maria);
    this.router.get("/ihmiset/miia", this.miia);
    this.router.get("/ihmiset/peter", this.peter);
    this.router.get("/ihmiset/reima", this.reima);
    this.router.get("/ihmiset/sami", this.sami);
    this.router.get("/ihmiset/selina", this.selina);
    this.router.get("/ihmiset/tapani", this.tapani);
       */
    this.router.get("/ihmiset/timo", this.timo);
    /*
    this.router.get("/ihmiset/tuukka", this.tuukka);
    this.router.get("/ihmiset/tytti", this.tytti);
    this.router.get("/ihmiset/villiam", this.villiam);
    this.router.get("/robots.txt", this.robots);*/

  }

  // PUBLIC

  public getRoutes(): Router.IMiddleware {
    return this.router.routes();
  }

  public getHelperMethods(): Array<[string, any]> {
    return [
      ["getSliceOfArrayWithRemaining", (array, queryParamRemaining) => {
        return getSliceOfArrayWithRemaining(this.POSTS_PER_PAGE, array, queryParamRemaining);
      }],
    ];
  }

  // ROUTES

  private index(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/etusivu");
  }
  private palvelut(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/palvelut");
  }
  private sisaisenMotivaationJohtaminen(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/sisaisenmotivaationjohtaminen");
  }
  private ajattelunhallinta(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/ajattelunhallinta");
  }
  private ihmiset(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/ihmiset");
  }
  private tutkimus(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/tutkimus");
  }
  private motivoivinEsimies(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    const questionnaire1Url = "https://filosofianakatemia.typeform.com/to/ooHe2y";
    const questionnaire2Url = "https://filosofianakatemia.typeform.com/to/bYzgd1";
    if (Math.random() >= 0.5) {
      ctx.redirect(questionnaire1Url);
    } else {
      ctx.redirect(questionnaire2Url);
    }
  }

  private async blogi(ctx: Router.IRouterContext, next: () => Promise<any>): Promise<any> {
    console.info("GET ", ctx.path);
    const faPublicItems = await ctx.state.backendClient.getPublicItems("filosofian-akatemia");
    const faBlogs = faPublicItems.getNotes([{type: "keyword", include: "blogi"}]);
    const arrayInfo = ctx.state.getSliceOfArrayWithRemaining(faBlogs, ctx.query.remaining);
    const blogsContext = arrayInfo.arraySlice.map( (faBlogNote) => {
      return ctx.state.render.processBlogPost(faBlogNote);
    });
    const renderContext: any = {
      blogs: blogsContext,
      remaining: arrayInfo.remaining,
    };
    ctx.body = ctx.state.render.template("pages/blogi", renderContext);
  }

  private async blogiTeksti(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const faPublicItems = await ctx.state.backendClient.getPublicItems("filosofian-akatemia");
    const faBlogs = faPublicItems.getNotes([{type: "keyword", include: "blogi"}]);
    const faBlogNote = faBlogs.find( (note) => {
      return note.visibility && note.visibility.path === ctx.params.blogPath;
    });
    if (faBlogNote) {
      ctx.body = ctx.state.render.template("pages/blogiteksti",
          ctx.state.render.getBlogPostContext(faPublicItems, faBlogNote));
    }
  }

  // Test URL:
  // http://localhost:3001/esikatselu/55449eb6-2fb3-41d5-b806-b4e3be5692cc/c876628e-1d67-411a-84f9-5dfedbed8872/1
  private async preview(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const note = await ctx.state.backendClient.getPreviewItem(
      ctx.params.ownerUUID, ctx.params.itemUUID, ctx.params.previewCode);

    // Render page based on preview note keywords
    const faPublicItems = await ctx.state.backendClient.getPublicItems("filosofian-akatemia");
    if (note.keywords && note.keywords.length) {
      for (const keyword of note.keywords) {
        if (keyword.title.startsWith("blog")) {
          ctx.body = ctx.state.render.template("pages/blogiteksti",
              ctx.state.render.getBlogPostContext(faPublicItems, note));
          break;
        }
      }
    }
  }

  // People routes

  private async timo(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const faPublicItems = await ctx.state.backendClient.getPublicItems("filosofian-akatemia");
    const personContext = {
      personQuote: true,
      personDescription: ctx.state.render.markdownWithImgVersion(
          faPublicItems.getNote("timo-tiuraniemi").content),
    };
    ctx.body = ctx.state.render.template("pages/timo", personContext);
  }

  // HELPER METHODS

    /*

  private async getUnrenderedBlogs(ctx: Router.IRouterContext) {
    const faPublicItems = await ctx.state.backendClient.getPublicItems("filosofian-akatemia");
    return ctx.state.filterBlogsFromPublicItems(faPublicItems);
  }

  private generateBlogs(ctx: Router.IRouterContext, unrenderedBlogs: any): any {
    const blogs = [];
    for (const unrenderedBlog of unrenderedBlogs) {
      blogs.push(ctx.state.generateBlogPost(ctx, unrenderedBlog));
    }
    return blogs;
  }

  private filterBlogsFromPublicItems(ctx: Router.IRouterContext, faPublicItems: any): any {
    return faPublicItems.getNotes([{type: "keyword", include: "blogi"}]);
  }

  private generateBlogPost(ctx: Router.IRouterContext, publicNote) {
    const blog = {safeTitle: publicNote.title, title: publicNote.title.replace(/&shy;/g,"")};
    const noteHtml = markdownParser.render(publicNote.content);
    const extractResult = extractLeadAndPictureAndContentFromHtml(noteHtml);
    blog.content = extractResult.content;
    if ((blog.content.match(/<p>/g) || []).length < 4) {
      blog.lessThanFourParagraphs = true;
    }
    blog.lead = extractResult.lead;

    if (extractResult.pictureData) {
      blog.pictureData = extractResult.pictureData;
    }

    if (publicNote.keywords && publicNote.keywords.length) {
      for (keyword of publicNote.keywords.length) {
        if (isAuthorTag(keyword)) {
          blog.author = {
            id: keyword.title,
            name: getAuthorName(keyword)
          };
          if (!blog.pictureData) {
            // Get the picture of the author, when the blog post has no picture set.
            blog.pictureData = {
              source: getAuthorPicturePath(keyword)
            }
          }
          break;
        }
      }
    }
    blog.published = publicNote.visibility.published;
    blog.path = publicNote.visibility.path;
    return blog;
  }
  */

    /*

  private async headers(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const publicHeaders = await ctx.state.backendClient.getPublicHeaders();
    const headers = publicHeaders.getNotes([{type: "blacklisted"}]);
    let arrayInfo = ctx.state.getSliceOfArrayWithRemaining(headers, ctx.query.remaining);
    let renderContext: any = {
      headers: arrayInfo.arraySlice,
      remaining: arrayInfo.remaining,
    };
    ctx.body = ctx.state.render.template("pages/headers", renderContext);
  }

  private async short(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const shortIdInfo = await ctx.state.backendClient.getShortId(ctx.params.sid);
    if (shortIdInfo) {
      let redirectPath = "/" + ctx.state.ownersPath + "/" + shortIdInfo.handle;
      if (shortIdInfo.path) {
        redirectPath += "/" + shortIdInfo.path;
      }
      ctx.redirect(redirectPath);
      ctx.status = 301;
    }
  }

  private async owner(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const publicItems = await ctx.state.backendClient.getPublicItems(ctx.params.handle);
    const owner = publicItems.getOwner();
    let renderContext: any = {
      owner: ctx.state.render.processOwner(owner),
      handle: ctx.params.handle,
    };
    if (!renderContext.owner.blacklisted) {
      const allNotes = publicItems.getNotes().map(note => ctx.state.render.processNote(note));
      let arrayInfo = ctx.state.getSliceOfArrayWithRemaining(allNotes, ctx.query.remaining);
      renderContext.notes = arrayInfo.arraySlice;
      renderContext.remaining = arrayInfo.remaining;

      // Create an image for this owner if owner image not already processed, and sharing is enabled
      if (renderContext.owner.ui && renderContext.owner.ui.sharing) {
        let imageUrl;
        let secureImageUrl;
        if (!owner.processed || owner.processed.modified !== owner.modified) {
          const imageFileName = await ctx.state.visualization.generateImageFromText(
            renderContext.owner.displayName, renderContext.owner.shortId, owner.modified);
          const generatedUrls = ctx.state.getGeneratedUrls(imageFileName, ctx.state.urlOrigin);
          imageUrl = generatedUrls.url;
          secureImageUrl = generatedUrls.secureUrl;
          publicItems.setOwnerProcessed({
            imageUrl: imageUrl,
            secureImageUrl: secureImageUrl,
          });
        }else {
          imageUrl = owner.processed.data.imageUrl;
          secureImageUrl = owner.processed.data.secureImageUrl;
        }
        renderContext.imageUrl = imageUrl;
        renderContext.secureImageUrl = secureImageUrl;
      }
      ctx.body = ctx.state.render.template("pages/owner", renderContext);
    }else {
      ctx.status = 404;
    }
  }

  private async note(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const publicItems = await ctx.state.backendClient.getPublicItems(ctx.params.handle);
    const note = publicItems.getNote(ctx.params.path);
    const owner = publicItems.getOwner();
    if (note && !owner.blacklisted) {
      let renderContext: any = {
        owner: owner,
        note: ctx.state.render.processNote(note),
        handle: ctx.params.handle,
      };

      // Create an image for this note if image has not already been processed, and sharing is enabled
      if (renderContext.note.ui && renderContext.note.ui.sharing) {
        if (!note.processed || note.processed.modified !== note.modified) {
          const imageFileName = await ctx.state.visualization.generateImageFromText(
            renderContext.note.title, renderContext.note.shortId, note.modified);
          const generatedUrls = ctx.state.getGeneratedUrls(imageFileName, ctx.state.urlOrigin);
          note.processed = {
            modified: note.modified,
            imageUrl: generatedUrls.url,
            secureImageUrl: generatedUrls.secureUrl,
          };
        }
        renderContext.imageUrl = note.processed.imageUrl;
        renderContext.secureImageUrl = note.processed.secureImageUrl;
      }
      ctx.body = ctx.state.render.template("pages/note", renderContext);
    }
  }

  private async preview(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const previewNote = await ctx.state.backendClient.getPreviewItem(
      ctx.params.ownerUUID, ctx.params.itemUUID, ctx.params.previewCode);

    if (previewNote) {
      let renderContext: any = {
        owner: previewNote.owner,
        note: ctx.state.render.processNote(previewNote),
        preview: true,
      };
      ctx.body = ctx.state.render.template("pages/note", renderContext);
    }
  }
  */
}
