import { z } from "zod";
import { IntercomClient } from "../api/client.js";

export const SearchArticlesSchema = z.object({
  phrase: z.string().optional(),
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
  console.error("articles", articles);

  return {
    articles: articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      description: article.description,
      // body: article.body,
      createdAt: new Date(article.created_at * 1000).toISOString(),
      updatedAt: new Date(article.updated_at * 1000).toISOString(),
      url: article.url,
    })),
  };
}
