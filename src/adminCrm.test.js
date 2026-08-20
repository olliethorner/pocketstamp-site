import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {crmListFilter,hasTechnicalTabs,pocketStampState,stageLabel} from "./adminCrm.js";

const accounts=[{id:"lead",stage:"interested",merchant_id:null,next_follow_up_at:"2026-08-21"},{id:"trial",stage:"trial",merchant_id:"m1"},{id:"customer",stage:"customer",merchant_id:"m2"}];
test("unified CRM list filters prospects, trials, customers, follow-ups and configured merchants",()=>{assert.deepEqual(crmListFilter(accounts,"prospects").map((a)=>a.id),["lead"]);assert.deepEqual(crmListFilter(accounts,"trials").map((a)=>a.id),["trial"]);assert.deepEqual(crmListFilter(accounts,"customers").map((a)=>a.id),["customer"]);assert.deepEqual(crmListFilter(accounts,"follow_up").map((a)=>a.id),["lead"]);assert.deepEqual(crmListFilter(accounts,"configured").map((a)=>a.id),["trial","customer"]);});
test("sales stage and PocketStamp state stay independent",()=>{const account={stage:"interested",merchant_id:"fara",pocketstamp_state:{appleReady:true,googleReady:true,assetsReady:true}};assert.equal(stageLabel(account.stage),"Interested");assert.equal(pocketStampState(account),"Apple Ready · Google Ready · Assets Ready");});
test("cold prospects never receive technical tabs while linked merchants retain them",()=>{assert.equal(hasTechnicalTabs({merchant_id:null}),false);assert.equal(hasTechnicalTabs({merchant_id:"m"}),true);});
test("CRM UI keeps legacy technical route and adds sales-first account route",()=>{const portal=fs.readFileSync(new URL("./AdminPortal.jsx",import.meta.url),"utf8"),crm=fs.readFileSync(new URL("./AdminCrm.jsx",import.meta.url),"utf8");assert.match(portal,/crmDetailMatch/);assert.match(portal,/MerchantDetailPage/);assert.match(crm,/Quick log activity/);assert.match(crm,/Activity timeline/);assert.match(crm,/PocketStamp setup/);});
