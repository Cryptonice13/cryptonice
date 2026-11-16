import { assertEquals } from "jsr:@std/assert";
import {
  COINBASE_PRODUCTS,
  MAX_AFTER_RESOLUTION_MS,
  MAX_TRADE_AGE_MS,
  parseFreshSpotQuote,
} from "./pricing.ts";

const NOW = Date.parse("2026-11-16T06:00:00.000Z");

Deno.test("all supported prediction assets map to a USD exchange pair", () => {
  assertEquals(Object.keys(COINBASE_PRODUCTS).length, 16);
  assertEquals(COINBASE_PRODUCTS.BTC, "BTC-USD");
  assertEquals(COINBASE_PRODUCTS.MATIC, "MATIC-USD");
  assertEquals(COINBASE_PRODUCTS.OP, "OP-USD");
});

Deno.test("fresh Coinbase ticker is accepted with its source timestamp", () => {
  const quote = parseFreshSpotQuote("BTC", {
    price: "64570.84",
    time: new Date(NOW - 30_000).toISOString(),
  }, NOW);

  assertEquals(quote?.price, 64570.84);
  assertEquals(quote?.pair, "BTC-USD");
  assertEquals(quote?.quoteAt, new Date(NOW - 30_000).toISOString());
});

Deno.test("ticker older than the 120-second freshness limit is rejected", () => {
  const quote = parseFreshSpotQuote("ETH", {
    price: "1811.76",
    time: new Date(NOW - MAX_TRADE_AGE_MS - 1).toISOString(),
  }, NOW);

  assertEquals(quote, null);
});

Deno.test("settlement rejects quotes more than 30 seconds after the market deadline", () => {
  const quote = parseFreshSpotQuote("ETH", {
    price: "1811.76",
    time: new Date(NOW + MAX_AFTER_RESOLUTION_MS + 1).toISOString(),
  }, NOW + MAX_AFTER_RESOLUTION_MS + 1, NOW);

  assertEquals(quote, null);
});

Deno.test("settlement accepts an exchange trade up to 30 seconds after its deadline", () => {
  const quote = parseFreshSpotQuote("ETH", {
    price: "1811.76",
    time: new Date(NOW + MAX_AFTER_RESOLUTION_MS).toISOString(),
  }, NOW + MAX_AFTER_RESOLUTION_MS, NOW);

  assertEquals(quote?.price, 1811.76);
});

Deno.test("missing timestamps and invalid prices fail closed", () => {
  assertEquals(parseFreshSpotQuote("BTC", { price: "64570.84" }, NOW), null);
  assertEquals(parseFreshSpotQuote("BTC", { price: "0", time: new Date(NOW).toISOString() }, NOW), null);
});

Deno.test("unknown assets and timestamps too far in the future are rejected", () => {
  assertEquals(parseFreshSpotQuote("UNKNOWN", { price: "1", time: new Date(NOW).toISOString() }, NOW), null);
  assertEquals(parseFreshSpotQuote("BTC", { price: "64570.84", time: new Date(NOW + 5_001).toISOString() }, NOW), null);
});