export interface PersonPictures {
  large: string;
  thumbnail: string;
}

export interface PersonPaths {
  page: string;
  description: string;
}

export interface Person {
  id: string;
  name: string;
  pictures: PersonPictures;
  paths: PersonPaths;
}

export class People {

  private imagePathPrefix: string;
  private people: Person[];

  constructor(private version: string) {
    this.imagePathPrefix = "/static/" + version + "/img/";
    this.initializePeople();
  }

  public isAuthorTag(tag): boolean {
    if (this.getAuthorName(tag)) {
      return true;
    }
    return false;
  }

  public getAuthorName(tag): string {
    if (tag.title === "fa") {
      return "Filosofian Akatemia";
    } else {
      for (const person of this.people) {
        if (person.id === tag.title) {
          return person.name;
        }
      }
    }
  }

  public getAuthorDescriptionPath(authorId: string): string {
    for (const person of this.people) {
      if (person.id === authorId) {
        return person.paths.description;
      }
    }
  }

  public getAuthorPagePath(authorId: string): string {
    for (const person of this.people) {
      if (person.id === authorId) {
        return person.paths.page;
      }
    }
  }

  public getAuthorThumbnailPath(authorId: string): string {
    for (const person of this.people) {
      if (person.id === authorId) {
        return person.pictures.thumbnail;
      }
    }
  }

  public getAuthorPicturePath(authorId: string): string {
    for (const person of this.people) {
      if (person.id === authorId) {
        return person.pictures.large;
      }
    }
  }

  // PRIVATE

  private initializePeople(): void {
    this.people = [
      {
        id: "emilia",
        name: "Emilia Lahti",
        pictures: {
          large: this.imagePathPrefix + "emilia-large.jpg",
          thumbnail: this.imagePathPrefix + "emilia-thumbnail.png",
        },
        paths: {
          page: "emilia-lahti",
          description: "emilia-lahti-kuvaus",
        },
      },
      {
        id: "frank",
        name: "Frank Martela",
        pictures: {
          large: this.imagePathPrefix + "frank-large.jpg",
          thumbnail: this.imagePathPrefix + "frank-thumbnail.png",
        },
        paths: {
          page: "frank-martela",
          description: "frank-martela-kuvaus",
        },
      },
      {
        id: "iida",
        name: "Iida Mäkikallio",
        pictures: {
          large: this.imagePathPrefix + "iida-large.jpg",
          thumbnail: this.imagePathPrefix + "iida-thumbnail.png",
        },
        paths: {
          page: "iida-makikallio",
          description: "iida-makikallio-kuvaus",
        },
      },
      {
        id: "jp",
        name: "Jukka-Pekka Salo",
        pictures: {
          large: this.imagePathPrefix + "jp-large.jpg",
          thumbnail: this.imagePathPrefix + "jp-thumbnail.png",
        },
        paths: {
          page: "jukka-pekka-salo",
          description: "jukka-pekka-salo-kuvaus",
        },
      },
      {
        id: "karoliina",
        name: "Karoliina Jarenko",
        pictures: {
          large: this.imagePathPrefix + "karoliina-large.jpg",
          thumbnail: this.imagePathPrefix + "karoliina-thumbnail.png",
        },
        paths: {
          page: "karoliina-jarenko",
          description: "karoliina-jarenko-kuvaus",
        },
      },
      {
        id: "lauri",
        name: "Lauri Järvilehto",
        pictures: {
          large: this.imagePathPrefix + "lauri-large.jpg",
          thumbnail: this.imagePathPrefix + "lauri-thumbnail.png",
        },
        paths: {
          page: "lauri-jarvilehto",
          description: "lauri-jarvilehto-kuvaus",
        },
      },
      {
        id: "maija",
        name: "Maija Tiitinen",
        pictures: {
          large: this.imagePathPrefix + "maija-large.jpg",
          thumbnail: this.imagePathPrefix + "maija-thumbnail.jpg",
        },
        paths: {
          page: "maija-tiitinen",
          description: "maija-tiitinen-kuvaus",
        },
      },
      {
        id: "maria",
        name: "Maria Ruotsalainen",
        pictures: {
          large: this.imagePathPrefix + "maria-large.jpg",
          thumbnail: this.imagePathPrefix + "maria-thumbnail.png",
        },
        paths: {
          page: "maria-ruotsalainen",
          description: "maria-ruotsalainen-kuvaus",
        },
      },
      {
        id: "miia",
        name: "Miia Järvilehto",
        pictures: {
          large: this.imagePathPrefix + "miia-large.jpg",
          thumbnail: this.imagePathPrefix + "miia-thumbnail.png",
        },
        paths: {
          page: "miia-jarvilehto",
          description: "miia-jarvilehto-kuvaus",
        },
      },
      {
        id: "nick",
        name: "Nick Ahleskog",
        pictures: {
          large: this.imagePathPrefix + "nick-large.jpg",
          thumbnail: this.imagePathPrefix + "nick-thumbnail.jpg",
        },
        paths: {
          page: "nick-ahleskog",
          description: "nick-ahleskog-kuvaus",
        },
      },
      {
        id: "peter",
        name: "Peter Kenttä",
        pictures: {
          large: this.imagePathPrefix + "peter-large.jpg",
          thumbnail: this.imagePathPrefix + "peter-thumbnail.png",
        },
        paths: {
          page: "peter-kentta",
          description: "peter-kentta-kuvaus",
        },
      },
      {
        id: "reima",
        name: "Reima Launonen",
        pictures: {
          large: this.imagePathPrefix + "reima-large.jpg",
          thumbnail: this.imagePathPrefix + "reima-thumbnail.png",
        },
        paths: {
          page: "reima-launonen",
          description: "reima-launonen-kuvaus",
        },
      },
      {
        id: "sami",
        name: "Sami Paju",
        pictures: {
          large: this.imagePathPrefix + "sami-large.jpg",
          thumbnail: this.imagePathPrefix + "sami-thumbnail.png",
        },
        paths: {
          page: "sami-paju",
          description: "sami-paju-kuvaus",
        },
      },
      {
        id: "tapani",
        name: "Tapani Riekki",
        pictures: {
          large: this.imagePathPrefix + "tapani-large.jpg",
          thumbnail: this.imagePathPrefix + "tapani-thumbnail.png",
        },
        paths: {
          page: "tapani-riekki",
          description: "tapani-riekki-kuvaus",
        },
      },
      {
        id: "tiina",
        name: "Tiina Setälä",
        pictures: {
          large: this.imagePathPrefix + "tiina-large.jpg",
          thumbnail: this.imagePathPrefix + "tiina-thumbnail.jpg",
        },
        paths: {
          page: "tiina-setala",
          description: "tiina-setala-kuvaus",
        },
      },
      {
        id: "timo",
        name: "Timo Tiuraniemi",
        pictures: {
          large: this.imagePathPrefix + "timo-large.jpg",
          thumbnail: this.imagePathPrefix + "timo-thumbnail.png",
        },
        paths: {
          page: "timo-tiuraniemi",
          description: "timo-tiuraniemi-kuvaus",
        },
      },
      {
        id: "tuukka",
        name: "Tuukka Kostamo",
        pictures: {
          large: this.imagePathPrefix + "tuukka-large.jpg",
          thumbnail: this.imagePathPrefix + "tuukka-thumbnail.png",
        },
        paths: {
          page: "tuukka-kostamo",
          description: "tuukka-kostamo-kuvaus",
        },
      },
      {
        id: "tytti",
        name: "Tytti Kokko",
        pictures: {
          large: this.imagePathPrefix + "tytti-large.jpg",
          thumbnail: this.imagePathPrefix + "tytti-thumbnail.jpg",
        },
        paths: {
          page: "tytti-kokko",
          description: "tytti-kokko-kuvaus",
        },
      },
    ];
  }
}
