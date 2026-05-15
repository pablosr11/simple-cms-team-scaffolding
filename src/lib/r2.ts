import { getCloudflareContext } from "@opennextjs/cloudflare";

function bucket() {
  return getCloudflareContext().env.RECEIPTS_BUCKET;
}

export function receiptKey(orgId: string, receiptId: string, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `org/${orgId}/${receiptId}/${safe}`;
}

export async function putReceipt(
  key: string,
  body: ArrayBuffer,
  contentType: string,
) {
  await bucket().put(key, body, {
    httpMetadata: { contentType },
  });
}

export async function getReceiptBytes(key: string): Promise<ArrayBuffer | null> {
  const obj = await bucket().get(key);
  return obj ? await obj.arrayBuffer() : null;
}
