export interface PersonPictures {
  large: string;
  thumbnail: string;
}

export interface PersonPaths {
  description: string;
}

export interface Person {
  id: string;
  name: string;
  pictures: PersonPictures;
  paths: PersonPaths;
}

export const people: Person[] = [
  {
    id: "emilia",
    name: "Emilia Lahti",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/emilia-large.jpg",
      thumbnail: "/static/img/emilia-thumbnail.png",
    },
    paths: {
      description: "emilia-lahti-kuvaus",
    },
  },
  {
    id: "frank",
    name: "Frank Martela",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/frank-large.jpg",
      thumbnail: "/static/img/frank-thumbnail.png",
    },
    paths: {
      description: "frank-martela-kuvaus",
    },
  },
  {
    id: "iida",
    name: "Iida Mäkikallio",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/iida-large.jpg",
      thumbnail: "/static/img/iida-thumbnail.png",
    },
    paths: {
      description: "iida-makikallio-kuvaus",
    },
  },
  {
    id: "joonas",
    name: "Joonas Pesonen",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/joonas-large.jpg",
      thumbnail: "/static/img/joonas-thumbnail.png",
    },
    paths: {
      description: "joonas-pesonen-kuvaus",
    },
  },
  {
    id: "jp",
    name: "Jukka-Pekka Salo",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/jp-large.jpg",
      thumbnail: "/static/img/jp-thumbnail.png",
    },
    paths: {
      description: "jp-salo-kuvaus",
    },
  },
  {
    id: "karoliina",
    name: "Karoliina Jarenko",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/karoliina-large.jpg",
      thumbnail: "/static/img/karoliina-thumbnail.png",
    },
    paths: {
      description: "karoliina-jarenko-kuvaus",
    },
  },
  {
    id: "lauri",
    name: "Lauri Järvilehto",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/lauri-large.jpg",
      thumbnail: "/static/img/lauri-thumbnail.png",
    },
    paths: {
      description: "lauri-jarvilehto-kuvaus",
    },
  },
  {
    id: "maija",
    name: "Maija Tiitinen",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/maija-large.jpg",
      thumbnail: "/static/img/maija-thumbnail.png",
    },
    paths: {
      description: "maija-tiitinen-kuvaus",
    },
  },
  {
    id: "maria",
    name: "Maria Ruotsalainen",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/maria-large.jpg",
      thumbnail: "/static/img/maria-thumbnail.png",
    },
    paths: {
      description: "maria-ruotsalainen-kuvaus",
    },
  },
  {
    id: "miia",
    name: "Miia Maijala",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/miia-large.jpg",
      thumbnail: "/static/img/miia-thumbnail.png",
    },
    paths: {
      description: "miia-maijala-kuvaus",
    },
  },
  {
    id: "peter",
    name: "Peter Kenttä",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/peter-large.jpg",
      thumbnail: "/static/img/peter-thumbnail.png",
    },
    paths: {
      description: "peter-kentta-kuvaus",
    },
  },
  {
    id: "reima",
    name: "Reima Launonen",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/reima-large.jpg",
      thumbnail: "/static/img/reima-thumbnail.png",
    },
    paths: {
      description: "reima-launonen-kuvaus",
    },
  },
  {
    id: "sami",
    name: "Sami Paju",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/sami-large.jpg",
      thumbnail: "/static/img/sami-thumbnail.png",
    },
    paths: {
      description: "sami-paju-kuvaus",
    },
  },
  {
    id: "selina",
    name: "Selina Bakir",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/selina-large.jpg",
      thumbnail: "/static/img/selina-thumbnail.png",
    },
    paths: {
      description: "selina-bakir-kuvaus",
    },
  },
  {
    id: "tapani",
    name: "Tapani Riekki",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/tapani-large.jpg",
      thumbnail: "/static/img/tapani-thumbnail.png",
    },
    paths: {
      description: "tapani-riekki-kuvaus",
    },
  },
  {
    id: "timo",
    name: "Timo Tiuraniemi",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/timo-large.jpg",
      thumbnail: "/static/img/timo-thumbnail.png",
    },
    paths: {
      description: "timo-tiuraniemi-kuvaus",
    },
  },
  {
    id: "tuukka",
    name: "Tuukka Kostamo",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/tuukka-large.jpg",
      thumbnail: "/static/img/tuukka-thumbnail.png",
    },
    paths: {
      description: "tuukka-kostamo-kuvaus",
    },
  },
  {
    id: "tytti",
    name: "Tytti Kokko",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/tytti-large.jpg",
      thumbnail: "/static/img/tytti-thumbnail.png",
    },
    paths: {
      description: "tytti-kokko-kuvaus",
    },
  },
  {
    id: "villiam",
    name: "Villiam Virkkunen",
    pictures: {
      large: "https://filosofianakatemia.fi/static/img/villiam-large.jpg",
      thumbnail: "/static/img/villiam-thumbnail.png",
    },
    paths: {
      description: "villiam-virkkunen-kuvaus",
    },
  },
];

export function isAuthorTag(tag): boolean {
  if (this.getAuthorName(tag)) {
    return true;
  }
  return false;
}

export function getAuthorName(tag): string {
  if (tag.title === "fa") {
    return "Filosofian Akatemia";
  } else {
    return "";
  }
}

export function getAuthorDescriptionPath(authorId: string): string {
  for (const person of people) {
    if (person.id === authorId) {
      return person.paths.description;
    }
  }
}

export function getAuthorThumbnailPath(authorId: string): string {
  for (const person of people) {
    if (person.id === authorId) {
      return person.pictures.thumbnail;
    }
  }
}

export function getAuthorPicturePath(authorId: string): string {
  for (const person of people) {
    if (person.id === authorId) {
      return person.pictures.large;
    }
  }
}

