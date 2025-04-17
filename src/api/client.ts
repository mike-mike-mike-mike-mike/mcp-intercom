import dotenv from "dotenv";
import { IntercomConversation } from "../types/intercom.js";
import axios from "axios";

dotenv.config();

const INTERCOM_API_BASE = "https://api.intercom.io";

export class IntercomClient {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.INTERCOM_API_KEY;
    if (!apiKey) {
      throw new Error("INTERCOM_API_KEY environment variable is required");
    }
    this.apiKey = apiKey;
  }

  private async request<T>(
    path: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(path, INTERCOM_API_BASE);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await axios.get(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    return response.data as T;
  }

  async searchConversations(
    filters: {
      createdAt?: { operator: string; value: number };
      updatedAt?: { operator: string; value: number };
      sourceType?: string;
      state?: string;
      open?: boolean;
      read?: boolean;
      // Add more filters as needed
    } = {},
    pagination: { perPage?: number; startingAfter?: string } = {}
  ) {
    const query: any = {
      operator: "AND",
      value: [],
    };

    if (filters.createdAt) {
      query.value.push({
        field: "created_at",
        operator: filters.createdAt.operator,
        value: filters.createdAt.value.toString(),
      });
    }
    if (filters.updatedAt) {
      query.value.push({
        field: "updated_at",
        operator: filters.updatedAt.operator,
        value: filters.updatedAt.value.toString(),
      });
    }
    if (filters.sourceType) {
      query.value.push({
        field: "source.type",
        operator: "=",
        value: filters.sourceType,
      });
    }
    if (filters.state) {
      query.value.push({
        field: "state",
        operator: "=",
        value: filters.state,
      });
    }
    if (filters.open !== undefined) {
      query.value.push({
        field: "open",
        operator: "=",
        value: filters.open.toString(),
      });
    }
    if (filters.read !== undefined) {
      query.value.push({
        field: "read",
        operator: "=",
        value: filters.read.toString(),
      });
    }

    const body = {
      query,
      pagination: {
        per_page: pagination.perPage || 20,
        starting_after: pagination.startingAfter || null,
      },
    };

    const response = await axios.post(
      `${INTERCOM_API_BASE}/conversations/search`,
      body,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "Intercom-Version": "2.11",
        },
      }
    );

    return response.data as { conversations: IntercomConversation[] };
  }

  async searchArticles(
    filters: {
      phrase?: string;
    } = {},
    pagination: { perPage?: number; startingAfter?: string } = {}
  ) {
    const params: Record<string, string> = {};

    if (filters.phrase) {
      params.phrase = filters.phrase;
    }

    params.state = "published";
    params.highlight = "true";

    const response = await axios.get(`${INTERCOM_API_BASE}/articles/search`, {
      params,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Intercom-Version": "2.13",
      },
    });

    return response.data.data as { articles: any[] };
  }
}
