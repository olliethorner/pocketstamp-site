export const CRM_STAGES = ["new","contacted","interested","trial","customer","not_now","lost"];
export const CRM_ACTIVITY_TYPES = ["in_person_visit","email","phone_call","sms","instagram_dm","demo","note","trial_event"];
export function stageLabel(stage){return String(stage||"new").replaceAll("_"," ").replace(/\b\w/g,(v)=>v.toUpperCase());}
export function pocketStampState(account){if(!account?.merchant_id&&!account?.merchant?.id)return "Not configured";const state=account.pocketstamp_state||account.pocketStampState||{};const ready=[state.appleReady&&"Apple Ready",state.googleReady&&"Google Ready",state.assetsReady&&"Assets Ready"].filter(Boolean);return ready.length?ready.join(" · "):"Merchant linked";}
export function crmListFilter(accounts,filter){if(filter==="prospects")return accounts.filter((a)=>!a.merchant_id&&a.stage!=="customer");if(filter==="trials")return accounts.filter((a)=>a.stage==="trial");if(filter==="customers")return accounts.filter((a)=>a.stage==="customer");if(filter==="configured")return accounts.filter((a)=>a.merchant_id);if(filter==="follow_up")return accounts.filter((a)=>a.next_follow_up_at);return accounts;}
export function isArchived(account){return Boolean(account?.archived_at);}
export function hasTechnicalTabs(account){return Boolean(account?.merchant_id||account?.merchant?.id);}
export function crmListMessage({loading,error,total,visible}){if(loading)return "Loading CRM cafés…";if(error)return null;if(total===0)return "No CRM cafés are available.";if(visible===0)return "No CRM cafés match this view.";return null;}
export function distinctActivityNotes(summary,notes){const value=String(notes||"").trim();return value&&value!==String(summary||"").trim()?value:null;}
const REVIEW_ONLY_CONTEXTS=new Map([
  ["36619132f19bb72e0ab7c75b16f7b1ac206ab3a1fef2836e2d57ec49df01b305:IRL Outreach:30","Met Sadie (owner)."],
  ["36619132f19bb72e0ab7c75b16f7b1ac206ab3a1fef2836e2d57ec49df01b305:IRL Outreach:31","Met Harriet and Naomi (roles unconfirmed)."],
]);
function reviewContextKey(activity){const source=activity?.source_ref||activity?.sourceRef||{};return `${source.workbookSha256||""}:${source.sheet||""}:${source.row||""}`;}
export function decorateTimelineActivities(activities){const shown=new Set();return (activities||[]).map((activity)=>{const key=reviewContextKey(activity),reviewContext=REVIEW_ONLY_CONTEXTS.get(key)||null,showReviewContext=reviewContext&&!shown.has(key);if(showReviewContext)shown.add(key);return {...activity,displayNotes:distinctActivityNotes(activity.summary,activity.notes),reviewContext:showReviewContext?reviewContext:null};});}
export function assignedAdminLabel(account,adminContext){if(account?.assigned_admin?.full_name)return account.assigned_admin.full_name;if(account?.assigned_admin_user_id&&account.assigned_admin_user_id===adminContext?.id)return adminContext.fullName||adminContext.email||"Current admin";return account?.assigned_admin_user_id||"Unassigned";}
