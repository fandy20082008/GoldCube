import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("billing checkout coupon loading", () => {
    it("loads owned coupons without querying claimable wallet templates", async () => {
        const source = await readFile(resolve(process.cwd(), "src/app/(user)/billing/checkout/checkout-client.tsx"), "utf8");

        expect(source).toContain("listBillingCoupons({ productId, quantity, pageSize: 50, includeTemplates: false })");
    });

    it("uses card-purchase copy and bypasses order creation only for the manual provider", async () => {
        const source = await readFile(resolve(process.cwd(), "src/app/(user)/billing/checkout/checkout-client.tsx"), "utf8");

        expect(source).toContain('{ label: "卡密购买", value: "manual"');
        expect(source).toContain('description: "购买卡密后，请点击右上角【积分】进行兑换"');
        expect(source).toContain('if (provider === "manual")');
        expect(source).toContain("const result = openManualCardStore();");
        expect(source.indexOf('if (provider === "manual")')).toBeLessThan(source.indexOf("const order = await createBillingOrder"));
        expect(source).toContain('provider === "manual" ? "确认并购买" : "确认订单并继续支付"');
        expect(source).toContain("const result = await createPaymentCheckout");
    });
});
