import test from 'node:test'; import assert from 'node:assert/strict';
import { deriveMetrics, revenueScore } from '../src/analytics/kpis.js';
test('KPIはゼロ除算せず派生指標を計算する',()=>{assert.deepEqual(deriveMetrics({}),{engagement_rate:0,profile_ctr:0,link_ctr:0,follow_rate:0,revenue_per_impression:0,revenue_per_post:0});const x=deriveMetrics({impressions:1000,likes:50,replies:10,reposts:5,bookmarks:15,profile_clicks:30,link_clicks:10,follows:4,revenue:5000});assert.equal(x.engagement_rate,.08);assert.equal(x.profile_ctr,.03);assert.equal(x.revenue_per_impression,5)});
test('売上が高い投稿をIMPだけの投稿より優先する',()=>{assert.ok(revenueScore({impressions:10000,revenue:5000,conversions:2})>revenueScore({impressions:100000,revenue:0,conversions:0}))});
