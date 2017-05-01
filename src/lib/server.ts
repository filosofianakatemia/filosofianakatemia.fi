import * as Koa from "koa";
import * as logger from "koa-logger";
import * as serve from "koa-static";
import * as Router from "koa-router";
import * as path from "path";
import { Render } from "./rendering";
import { Utils, Info } from "extendedmind-siteutils";

export interface Config {
  version: string;
  port: number;
  externalStatic: boolean;
  debug: boolean;
  backend?: string;
  urlOrigin?: string;
  syncTimeTreshold?: number;
}

export class Server {

  private version: string;
  private port: number;
  private debug: boolean;
  private externalStatic: boolean;
  private app: Koa;
  private router: Router;
  private utils: Utils;
  private backendApiAddress: string;
  private urlOrigin: string = "https://filosofianakatemia.fi";

  constructor(config: Config) {
    this.version = config.version;
    this.port = config.port;
    this.debug = config.debug;
    this.externalStatic = config.externalStatic;
    if (config.urlOrigin) this.urlOrigin = config.urlOrigin;

    this.app = new Koa();
    this.router = new Router();

    // backend link

    if (config.backend) {
      // Backend API address is given with a string directly
      this.backendApiAddress = config.backend;
    }else {
      throw new Error("FATAL: config.backend must be set to either true or specific address");
    }
    const utilsConfig = config.syncTimeTreshold !== undefined ?
      {"syncTimeTreshold": config.syncTimeTreshold} : undefined;
    this.utils = new Utils(this.backendApiAddress, utilsConfig);
  }

  public run() {
    if (this.debug) {
      this.app.use(logger());
    }
    if (!this.externalStatic) {
      this.app.use(serve("./public"));
    }

    // get backend /info path from backend on boot

    let requestInProgress;
    let backendPollInterval = setInterval(() => {
      if (!requestInProgress) {
        requestInProgress = true;
        console.info("GET " + this.backendApiAddress + "/v2/info");
        const thisServer = this;
        this.utils.getInfo().then(function(backendInfo){
            requestInProgress = false;
            clearInterval(backendPollInterval);
            thisServer.startListening(backendInfo);
          },
          function(error){
            requestInProgress = false;
            console.info("backend returned status code: " + (error ? error.code : "unknown") + ", retrying...");
          });
      }
    }, 2000);
  }

  private startListening(backendInfo: Info){

    console.info("backend info:");
    console.info(JSON.stringify(backendInfo, null, 2));

    // setup rendering
    const viewsPath = path.join(__dirname, "../views");
    const render = new Render("nunjucks", viewsPath, this.version, this.debug, this.urlOrigin);

    // setup routing
    /*
    const routing = new Routing(this.utils, backendInfo, this.headersPath, this.ownersPath, this.extraRoutingModule);

    // setup context for all routes

    this.app.use((ctx, next) => {
      ctx.state.backendClient = this.utils;
      ctx.state.render = render;
      ctx.state.urlOrigin = this.urlOrigin;
      routing.getHelperMethods().forEach(helperInfo => {
        ctx.state[helperInfo[0]] = helperInfo[1];
      });
      return next();
    });

    // add routes
    this.app.use(routing.getRoutes());
     */
    // start listening
    this.app.listen(this.port);
    console.info("listening on port " + this.port);
  }
}
