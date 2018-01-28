import * as excerpt from "excerpt-html";
import * as jsdom from "jsdom";
import * as MarkdownIt from "markdown-it";
import * as MarkdownItContainer from "markdown-it-container";
import * as MarkdownItLinks from "markdown-it-link-attributes";
import * as nunjucks from "nunjucks";
import { People, Person } from "./people";

interface ContentExtract {
  content?: string;
  pictureData?: any;
  lead?: string;
  description?: string;
  source?: string;
}

interface BlogPost {
  safeTitle: string;
  title: string;
  content?: string;
  lessThanFourParagraphs: boolean;
  lead?: string;
  description?: string;
  author?: any;
  pictureData?: any;
  published?: string;
  path?: string;
}

export class Render {
  private nunjucksEnvironment: nunjucks.Environment;
  private contentMarkdownParser: MarkdownIt.MarkdownIt;
  private people: People;
  private JSDOM: any;

  constructor(private extension: string, viewsDirectory: string, private version: string,
              debug: boolean, urlOrigin: string) {
    this.nunjucksEnvironment =
      this.initializeNunjucs(
        viewsDirectory, version, debug, urlOrigin);
    this.contentMarkdownParser = this.initializeFullMarkdown();
    this.people = new People(version);
    this.JSDOM = jsdom.JSDOM;
  }

  // PUBLIC INTERFACE

  // Simple Nunjucks processor
  public template(pathToView: string, context?: any): string {
    pathToView += "." + this.extension;
    return this.nunjucksEnvironment.render(pathToView, context);
  }

  // Simple markdown processor
  public markdown(content: string): string {
    return this.contentMarkdownParser.render(content);
  }

  // Cache-busted img mardowning
  public markdownWithImgVersion(content: string): string {
    const cacheBustedContent = content.split("/static/img/").join("/static/" + this.version + "/img/");
    return this.contentMarkdownParser.render(cacheBustedContent);
  }

  // Process entire note into a usable object
  public processBlogPost(publicNote: any): BlogPost {
    const blog: BlogPost = {
      safeTitle: publicNote.title as string, title: this.sanitizeTitle(publicNote.title),
      lessThanFourParagraphs: false,
    };
    const noteHtml = this.contentMarkdownParser.render(publicNote.content);
    const extractResult = this.extractLeadAndPictureAndContentFromHtml(noteHtml);
    blog.content = extractResult.content;
    if ((blog.content.match(/<p>/g) || []).length < 4) {
      blog.lessThanFourParagraphs = true;
    }
    blog.lead = extractResult.lead;
    blog.description = extractResult.description;

    if (extractResult.pictureData) {
      blog.pictureData = extractResult.pictureData;
    }

    if (publicNote.keywords && publicNote.keywords.length) {
      for (const keyword of publicNote.keywords) {
        if (this.people.isAuthorTag(keyword)) {
          blog.author = {
            id: keyword.title,
            name: this.people.getAuthorName(keyword),
          };
          if (!blog.pictureData) {
            // Get the picture of the author, when the blog post has no picture set.
            blog.pictureData = {
              source: this.people.getAuthorPicturePath(keyword),
            };
          }
          break;
        }
      }
    }
    if (publicNote.visibility) {
      blog.published = publicNote.visibility.published;
      blog.path = publicNote.visibility.path;
    }
    return blog;
  }

  public getBlogPostContext(faPublicItems, blogPost, previousBlogPost, nextBlogPost) {
    const blog = this.processBlogPost(blogPost);
    for (const keyword of blogPost.keywords) {
      if (this.people.isAuthorTag(keyword)) {
        // Get the introduction of the author.
        const personDescriptionPath = this.people.getAuthorDescriptionPath(keyword.title);
        const personDescriptionNote = faPublicItems.getNote(personDescriptionPath);
        if (personDescriptionNote) {
          if (!blog.author) {
            blog.author = {};
          }
          blog.author.description = this.contentMarkdownParser.render(personDescriptionNote.content);
          blog.author.pictureSource = this.people.getAuthorThumbnailPath(keyword.title);
        }
        break;
      }
    }
    return {
      blog,
      nextBlog: this.getBlogTitleAndLink(nextBlogPost),
      previousBlog: this.getBlogTitleAndLink(previousBlogPost),
    };
  }

  public getPersonContext(faPublicItems, personId) {
    const personDescription = this.markdownWithImgVersion(
        faPublicItems.getNote(this.people.getAuthorPagePath(personId)).content);
    return {
      personQuote: true,
      personDescription,
    };
  }

  // HELPERS

  private getBlogTitleAndLink(blogPost) {
    if (blogPost) {
      return {
        title: this.sanitizeTitle(blogPost.title),
        url: blogPost.visibility ? blogPost.visibility.path : undefined,
      };
    }
  }

  private sanitizeTitle(title: string): string {
    return title.replace(/&shy;/g, "");
  }

  private extractLeadAndPictureAndContentFromHtml(htmlText: string): ContentExtract {
    const extractedHTML: ContentExtract = {};
    // Create DOM from HTML string.
    const contentDocument = new this.JSDOM(htmlText).window.document;
    const bodyElement = contentDocument.getElementsByTagName("body")[0];
    const firstChildElement = bodyElement.firstElementChild;
    // Elements are wrapped into paragraphs (<p> tags), check the content of the first child node.
    const firstGrandChildElement = firstChildElement.firstElementChild;

    if (firstGrandChildElement && firstGrandChildElement.nodeName === "IMG") {
      // First child node contains a picture.
      extractedHTML.pictureData = {
        picture: firstChildElement.innerHTML,
        // tslint:disable-next-line
        source: firstGrandChildElement["src"],
      };
      // tslint:disable-next-line
      if (firstGrandChildElement["title"]) {
        // Get the caption stored into the title attribute of the element.
        // tslint:disable-next-line
        extractedHTML.pictureData.caption = firstGrandChildElement["title"];
      }
      const secondChildElement = bodyElement.children[1];  // Get the second child element.
      extractedHTML.lead = secondChildElement.innerHTML;
      extractedHTML.description = secondChildElement.textContent;

      bodyElement.removeChild(firstChildElement);
      bodyElement.removeChild(secondChildElement);
    } else {
      bodyElement.removeChild(firstChildElement);
      extractedHTML.lead = firstChildElement.innerHTML;
    }
    extractedHTML.content = bodyElement.innerHTML;

    return extractedHTML;
  }

  // NUNJUCKS

  private initializeNunjucs(viewsDirectory: string, version: string,
                            debug: boolean, urlOrigin: string): nunjucks.Environment {
    const  nj: nunjucks.Environment = nunjucks.configure(viewsDirectory, {
      autoescape: true,
      noCache: debug,
      watch: debug,
    });

    nj.addGlobal("version", version);
    nj.addGlobal("development", debug);
    nj.addGlobal("urlOrigin", urlOrigin);

    // Add utility methods
    nj.addGlobal("formatDate", this.formatDate);
    nj.addFilter("d.M.yyyy", this.ddmmyyyy);

    let domain;
    if (urlOrigin && urlOrigin.startsWith("https://")) {
      domain = urlOrigin.substr(8);
    } else if (urlOrigin && urlOrigin.startsWith("http://")) {
      domain = urlOrigin.substr(7);
    } else {
      // Fail if urlOrigin is invalid
      throw new Error("FATAL: urlOrigin invalid or not set, exiting");
    }
    nj.addGlobal("domain", domain);
    return nj;
  }

  // MARKDOWN-IT

  private initializeFullMarkdown(): MarkdownIt.MarkdownIt {
    const mp: MarkdownIt.MarkdownIt =
      new MarkdownIt("default", { linkify: true, typographer: true});
    // tslint:disable-next-line
    mp.renderer.rules["blockquote_close"] = this.blockquote_close;
    mp.use(MarkdownItContainer, "left-align", {render: this.leftContainerRender});
    mp.use(MarkdownItContainer, "right-align", {render: this.rightContainerRender});
    // tslint:disable-next-line
    mp.renderer.rules["video"] = this.tokenize_video(mp);
    mp.inline.ruler.before("emphasis", "video", this.video_embed(mp));
    mp.use(MarkdownItLinks, {
      target: "_blank",
      rel: "noopener",
    });
    return mp;
  }

  private blockquote_close() {
    return '<span class="icon-quote"><span></blockquote>';
  }

  private leftContainerRender(tokens, idx) {
    if (tokens[idx].nesting === 1) {
      // opening tag
      return "<div class=\"large-5 large-offset-1 left-aligned columns\">\n";
    } else {
      // closing tag
      return "</div>\n";
    }
  }

  private rightContainerRender(tokens, idx) {
    if (tokens[idx].nesting === 1) {
      // opening tag
      return "<div class=\"large-5 columns end person-details\">" +
      "<div class=\"show-for-large-up\"><br/><br/></div>\n";
    } else {
      // closing tag
      return "</div>\n";
    }
  }

  private tokenize_video(md) {
    const self = this;
    function tokenize_return(tokens, idx, options, env) {
      const videoID = md.utils.escapeHtml(tokens[idx].videoID);
      const service = md.utils.escapeHtml(tokens[idx].service);
      if (videoID === "") {
          return "";
      }

      if (service.toLowerCase() === "youtube") {
        return self.tokenize_youtube(videoID);
      } else if (service.toLowerCase() === "vimeo") {
        return self.tokenize_vimeo(videoID);
      } else {
        return("");
      }
    }
    return tokenize_return;
  }

  private tokenize_youtube(videoID) {
    const embedStart =
      '<div class="embed-responsive embed-responsive-16by9">' +
      '<iframe class="embed-responsive-item" id="ytplayer" type="text/html" ' +
      'width="640" height="390" src="//www.youtube.com/embed/';
    const embedEnd = '" frameborder="0"></iframe></div>';
    return embedStart + videoID + embedEnd;
  }

  private tokenize_vimeo(videoID) {
    const embedStart =
      '<div class="embed-responsive embed-responsive-16by9">' +
      '<iframe class="embed-responsive-item" id="vimeoplayer" ' +
      'width="500" height="281" src="//player.vimeo.com/video/';
    const embedEnd = '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
    return embedStart + videoID + embedEnd;
  }

  private video_embed(md: MarkdownIt.MarkdownIt) {
    const self = this;
    function video_return(state) {
      // tslint:disable
      var code,
          serviceEnd,
          serviceStart,
          pos,
          res,
          videoID = "",
          tokens,
          token,
          start,
          oldPos = state.pos,
          max = state.posMax;
      // tslint:enable

      // When we add more services, (youtube) might be (youtube|vimeo|vine), for example
      const EMBED_REGEX = /@\[(youtube|vimeo)\]\([\s]*(.*?)[\s]*[\)]/im;

      if (state.src.charCodeAt(state.pos) !== 0x40/* @ */) {
        return false;
      }
      if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) {
        return false;
      }

      const match = EMBED_REGEX.exec(state.src);

      if (!match) {
        return false;
      }

      if (match.length < 3) {
        return false;
      }

      const service = match[1];
      // tslint:disable-next-line
      var videoID = match[2];
      if (service.toLowerCase() === "youtube") {
        videoID = self.youtube_parser(videoID);
      } else if (service.toLowerCase() === "vimeo") {
        videoID = self.vimeo_parser(videoID);
      }

      // If the videoID field is empty, regex currently make it the close parenthesis.
      if (videoID === ")") {
        videoID = "";
      }

      serviceStart = state.pos + 2;
      serviceEnd = md.helpers.parseLinkLabel(state, state.pos + 1, false);

      //
      // We found the end of the link, and know for a fact it's a valid link;
      // so all that's left to do is to call tokenizer.
      //
      state.pos = serviceStart;
      state.posMax = serviceEnd;
      state.service = state.src.slice(serviceStart, serviceEnd);
      const newState = new state.md.inline.State(
        service,
        state.md,
        state.env,
        tokens = [],
      );
      newState.md.inline.tokenize(newState);

      token = state.push("video", "");
      token.videoID = videoID;
      token.service = service;
      token.level = state.level;

      state.pos = state.pos + state.src.indexOf(")");
      state.posMax = state.tokens.length;
      return true;
    }

    return video_return;
  }

  // Youtube (and non-tested Vimeo)

  // The youtube_parser is from http://stackoverflow.com/a/8260383
  private youtube_parser(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[7].length === 11) {
      return match[7];
    } else {
      return url;
    }
  }

  // The vimeo_parser is from http://stackoverflow.com/a/13286930
  private vimeo_parser(url) {
    // tslint:disable-line:max-line-length
    const regExp = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    if (match) {
      return match[3];
    } else {
      return url;
    }
  }

  // UTILITY CLASSES

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toDateString();
  }

  private ddmmyyyy(timestamp: number): string {
    // http://stackoverflow.com/a/3552493
    // https://docs.angularjs.org/api/ng/filter/date
    const date = new Date(timestamp);
    return date.getDate() + "." + (1 + date.getMonth()) + "." + date.getFullYear();
  }

}
