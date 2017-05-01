import * as Router from "koa-router";
import { Info, Utils } from "extendedmind-siteutils";

export class Routing {
  private router = new Router();

  constructor(private backendClient: Utils,
              private backendInfo: Info) {
    // SETUP router
    this.router.get('/', this.index);
    /*    this.router.get('/palvelut', this.palvelut);
    this.router.get('/palvelut/sisaisen-motivaation-johtaminen', this.sisaisenMotivaationJohtaminen);
    this.router.get('/palvelut/mielensavalottajat', this.mielensavalottajat);
    this.router.get('/palvelut/ajattelunhallinta', this.ajattelunhallinta);
    this.router.get('/ihmiset', this.ihmiset);
    this.router.get('/tutkimus', this.tutkimus);
    this.router.get('/blogi', this.blogi);
    this.router.get('/blogi/:path', this.blogiTeksti);
    this.router.get('/blogi/sivu/:number', this.blogiSivu);
    this.router.get('/blogi/lukutila/sivu/:number', this.blogiLukutila);
    this.router.get('/esikatselu/:ownerUUID/:itemUUID/:code', this.esikatselu;
    this.router.get('/ihmiset/emilia', this.emilia));
    this.router.get('/ihmiset/frank', this.frank);
    this.router.get('/ihmiset/iida', this.iida);
    this.router.get('/ihmiset/joonas', this.joonas);
    this.router.get('/ihmiset/jp', this.jp);
    this.router.get('/ihmiset/karoliina', this.karoliina);
    this.router.get('/ihmiset/lauri', this.lauri);
    this.router.get('/ihmiset/maija', this.maija);
    this.router.get('/ihmiset/maria', this.maria);
    this.router.get('/ihmiset/miia', this.miia);
    this.router.get('/ihmiset/peter', this.peter);
    this.router.get('/ihmiset/reima', this.reima);
    this.router.get('/ihmiset/sami', this.sami);
    this.router.get('/ihmiset/selina', this.selina);
    this.router.get('/ihmiset/tapani', this.tapani);
    this.router.get('/ihmiset/timo', this.timo);
    this.router.get('/ihmiset/tuukka', this.tuukka);
    this.router.get('/ihmiset/tytti', this.tytti);
    this.router.get('/ihmiset/villiam', this.villiam);
    this.router.get('/robots.txt', this.robots);
    this.router.get('/kyselyt/motivoivin-esimies', this.motivoivinEsimies);*/
  }

  // PUBLIC

  public getRoutes(): Router.IMiddleware {
    return this.router.routes();
  }

  public getHelperMethods(): Array<[string, any]> {

    function filterBlogsFromPublicItems(faPublicItems: any): any{
      return faPublicItems.getNotes([{type: "keyword", include: "blogi"}]);
    }

    return [
      ["getSliceOfArrayWithRemaining", function(array, queryParamRemaining): any {
        const HEADERS_PER_PAGE: number = 10;
        // How many items were indicated as being not shown previously. If first query, everything is remaining
        const previousRemaining: number = queryParamRemaining === undefined ? array.length : queryParamRemaining;
        // Because new headers might be added to the top of the array, we use remaining to count the index from
        // the end.
        const firstHeaderIndex = array.length - previousRemaining;
        const arraySlice = array.slice(firstHeaderIndex, firstHeaderIndex + HEADERS_PER_PAGE);
        const remaining: number = array.length - (firstHeaderIndex + HEADERS_PER_PAGE) < 0
          ? 0 : array.length - (firstHeaderIndex + HEADERS_PER_PAGE);
        return {
          arraySlice: arraySlice,
          remaining: remaining,
        };
      }],
      ["getUnrenderedBlogs", async function(ctx: Router.IRouterContext): Promise<any> {
        let faPublicItems = await ctx.state.backendClient.getPublicItems('filosofian-akatemia');
        return filterBlogsFromPublicItems(faPublicItems);
      }]
    ];
  };

  // ROUTES

  private index(ctx: Router.IRouterContext): void {
    console.log('GET /');
    ctx.body = ctx.state.render.template('pages/etusivu');
  }

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
