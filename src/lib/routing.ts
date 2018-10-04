import { getSliceOfArrayWithRemaining, Info, Utils } from "extendedmind-siteutils";
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
    this.router.get("/", this.etusivu);
    this.router.get("/esittely", this.esittely);
    this.router.get("/palvelut", this.palvelut);
    this.router.get("/palvelut/itseohjautuvuus", this.itseohjautuvuus);
    this.router.get("/palvelut/sisaisen-motivaation-johtaminen", this.sisaisenMotivaationJohtaminen);
    this.router.get("/palvelut/ajattelunhallinta", this.ajattelunhallinta);
    this.router.get("/palvelut/ajattelunhallinta/avoin", this.ajattelunhallintaAvoin);
    this.router.get("/palvelut/sirkusvalmennus", this.sirkusvalmennus);
    this.router.get("/palvelut/draivi", this.draivi);
    this.router.get("/palvelut/metataidot", this.metataidot);
    this.router.get("/referenssit", this.referenssit);
    this.router.get("/ihmiset", this.ihmiset);
    this.router.get("/tutkimus", this.tutkimus);
    this.router.get("/kyselyt/motivoivin-esimies", this.motivoivinEsimies);
    this.router.get("/blogi", this.blogi);
    this.router.get("/blogi/:blogPath", this.blogiTeksti);
    this.router.get("/esikatselu/:ownerUUID/:itemUUID/:previewCode", this.preview);
    this.router.get("/ihmiset/alex", this.person);
    this.router.get("/ihmiset/eero", this.person);
    this.router.get("/ihmiset/frank", this.person);
    this.router.get("/ihmiset/iida", this.person);
    this.router.get("/ihmiset/jp", this.person);
    this.router.get("/ihmiset/karoliina", this.person);
    this.router.get("/ihmiset/lauri", this.person);
    this.router.get("/ihmiset/maija", this.person);
    this.router.get("/ihmiset/maria", this.person);
    this.router.get("/ihmiset/miia", this.person);
    this.router.get("/ihmiset/nick", this.person);
    this.router.get("/ihmiset/peter", this.person);
    this.router.get("/ihmiset/reima", this.person);
    this.router.get("/ihmiset/sami", this.person);
    this.router.get("/ihmiset/tapani", this.person);
    this.router.get("/ihmiset/timo", this.person);
    this.router.get("/ihmiset/tuukka", this.person);
    this.router.get("/ihmiset/tytti", this.person);

    // academyofphilosophy.com
    this.router.get("/en", this.englishFrontPage);
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

  private etusivu(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/etusivu");
  }
  private esittely(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/esittely");
  }
  private palvelut(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/palvelut");
  }
  private itseohjautuvuus(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/itseohjautuvuus");
  }
  private sisaisenMotivaationJohtaminen(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/sisaisenmotivaationjohtaminen");
  }
  private ajattelunhallinta(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/ajattelunhallinta");
  }
  private ajattelunhallintaAvoin(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.redirect("/palvelut/ajattelunhallinta");
  }
  private sirkusvalmennus(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/sirkusvalmennus");
  }
  private draivi(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/draivi");
  }
  private metataidot(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/metataidot");
  }
  private referenssit(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    ctx.body = ctx.state.render.template("pages/referenssit");
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

  // English routes

  private englishFrontPage(ctx: Router.IRouterContext): void {
    console.info("GET ", ctx.path);
    console.info(ctx.request);
    ctx.body = ctx.state.render.template("pages/english/frontpage");
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
      let previousFaBlogNote = undefined;
      let nextFaBlogNote = undefined;
      const faBlogIndex = faBlogs.indexOf(faBlogNote);
      if (faBlogs.length > 1) {
        if (faBlogIndex < (faBlogs.length - 1) ) {
          previousFaBlogNote = faBlogs[faBlogIndex + 1];
        }
        if (faBlogIndex !== 0) {
          nextFaBlogNote = faBlogs[faBlogIndex - 1];
        }
      }
      ctx.body = ctx.state.render.template("pages/blogiteksti",
          ctx.state.render.getBlogPostContext(faPublicItems, faBlogNote, previousFaBlogNote, nextFaBlogNote));
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
        if (keyword.title.startsWith("blog") || (keyword.parentTitle && keyword.parentTitle.startsWith("blog"))) {
          ctx.body = ctx.state.render.template("pages/blogiteksti",
              ctx.state.render.getBlogPostContext(faPublicItems, note));
          break;
        }
      }
    }
  }

  private async person(ctx: Router.IRouterContext, next: () => Promise<any>) {
    console.info("GET ", ctx.path);
    const personId = ctx.path.substr(ctx.path.lastIndexOf("/") + 1);
    const faPublicItems = await ctx.state.backendClient.getPublicItems("filosofian-akatemia");
    const personContext = ctx.state.render.getPersonContext(faPublicItems, personId);
    ctx.body = ctx.state.render.template("pages/" + personId, personContext);
  }

}
