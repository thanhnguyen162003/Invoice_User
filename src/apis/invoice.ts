"use client";

import invoiceSchema, { InvoiceResponseSchema } from "@/schemas/invoice.schema";
import { z } from "zod";
import axios from "axios";

import { baseURL } from "@/lib/config";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createInvoice = async (
  invoiceData: z.infer<typeof invoiceSchema>
) => {
  try {
    console.log("baseURL", baseURL);
    const response = await api.post("/invoices", invoiceData);
    return {
      data: response.data,
      status: response.status,
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      throw new Error(e.response.data.message || "Failed to create invoice");
    }
    throw new Error("Failed to create invoice");
  }
};

export const getInvoice = async ({ requestId }: { requestId: string }) => {
  try {
    const response = await api.get(`/invoices/${requestId}`);
    return {
      data: response.data,
      status: response.status,
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      throw new Error(e.response.data.message || "Failed to get invoice");
    }
    throw new Error("Failed to get invoice");
  }
};

export const getInvoicePdf = async ({
  invoiceDate,
  requestId,
}: {
  invoiceDate: any;
  requestId: string;
}) => {
  try {
    const response = await api.get(
      `/invoices-pdf?invoiceDate=${invoiceDate}&requestId=${requestId}`
    );
    return {
      data: response.data,
      status: response.status,
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      throw new Error(e.response.data.message || "Failed to get invoice pdf");
    }
    throw new Error("Failed to get invoice pdf");
  }
};

export const updateStatus = async ({ requestId }: { requestId: any }) => {
  try {
    const response = await api.patch(
      `/invoices/${requestId}/update-status?status=2`
    );
    return {
      data: response.data,
      status: response.status,
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      throw new Error(e.response.data.message || "Failed to update status");
    }
    throw new Error("Failed to update status");
  }
};
