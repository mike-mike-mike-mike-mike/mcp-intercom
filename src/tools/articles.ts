import { z } from "zod";
import { IntercomClient } from "../api/client.js";

export type Article = {
  id: string;
  title: string;
  description: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  url: string;
};

export const SearchArticlesSchema = z.object({
  phrase: z.string().optional(),
});

export const RetrieveArticleSchema = z.object({
  articleId: z.string(),
});

export async function searchArticles(
  args: z.infer<typeof SearchArticlesSchema>,
  server: any
) {
  const client = new IntercomClient();
  const params: Record<string, any> = {};

  if (args.phrase) {
    params.phrase = args.phrase;
  }

  const { articles } = await client.searchArticles(params);

  return {
    articles:
      articles?.map((article: any) => ({
        id: article.id,
        title: article.title,
        description: article.description,
        // body: article.body,
        createdAt: new Date(article.created_at * 1000).toISOString(),
        updatedAt: new Date(article.updated_at * 1000).toISOString(),
        // url: article.url,
      })) || [],
  };
}

export async function retrieveArticle(
  args: { id: string },
  server: any
): Promise<Article> {
  const client = new IntercomClient();
  const article = await client.retrieveArticle(args.id);
  console.error("Article", article);

  if (typeof article === "undefined") {
    throw new Error("Article not found");
  }

  return {
    id: article.id,
    title: article.title,
    description: article.description,
    body: article.body,
    createdAt: new Date(article.created_at * 1000).toISOString(),
    updatedAt: new Date(article.updated_at * 1000).toISOString(),
    url: article.url,
  };
}
