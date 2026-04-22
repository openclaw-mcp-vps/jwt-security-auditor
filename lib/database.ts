import fs from "fs/promises";
import path from "path";

import { SecurityReport } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_PATH = path.join(DATA_DIR, "reports.json");
const PURCHASES_PATH = path.join(DATA_DIR, "purchases.json");

interface PurchaseRecord {
  email: string;
  paymentId: string;
  source: "stripe" | "lemonsqueezy";
  eventType: string;
  createdAt: string;
}

async function ensureDataFile(filePath: string, fallback: unknown) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataFile(filePath, fallback);
  const content = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function saveReport(report: SecurityReport) {
  const reports = await readJsonFile<SecurityReport[]>(REPORTS_PATH, []);
  reports.unshift(report);
  await writeJsonFile(REPORTS_PATH, reports.slice(0, 300));
  return report;
}

export async function getReportById(id: string) {
  const reports = await readJsonFile<SecurityReport[]>(REPORTS_PATH, []);
  return reports.find((report) => report.id === id) || null;
}

export async function listRecentReports(limit = 20) {
  const reports = await readJsonFile<SecurityReport[]>(REPORTS_PATH, []);
  return reports.slice(0, limit);
}

export async function recordPurchase(input: Omit<PurchaseRecord, "createdAt">) {
  const purchases = await readJsonFile<PurchaseRecord[]>(PURCHASES_PATH, []);
  const record: PurchaseRecord = {
    ...input,
    email: input.email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
  };

  const exists = purchases.some(
    (purchase) => purchase.paymentId === record.paymentId || purchase.email === record.email,
  );

  if (!exists) {
    purchases.unshift(record);
    await writeJsonFile(PURCHASES_PATH, purchases.slice(0, 1000));
  }

  return record;
}

export async function hasPurchase(email: string) {
  const normalized = email.toLowerCase().trim();
  const purchases = await readJsonFile<PurchaseRecord[]>(PURCHASES_PATH, []);
  return purchases.some((purchase) => purchase.email === normalized);
}
