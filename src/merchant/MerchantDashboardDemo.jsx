import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Activity, ArrowLeft, BellRing, Check, ChevronDown,
  CircleUserRound, Gift, LayoutDashboard, Megaphone, Menu, QrCode,
  Search, Send, Sparkles, Stamp, Users, WalletCards, X,
} from "lucide-react";

const SITE_URL = "https://getpocketstamp.com";

const customers = [
  ["sophie", "Sophie Turner", "sophie@example.com", 7, "Almost there", "Today, 10:42", "14 visits", "January"],
  ["james", "James Wilson", "james@example.com", 9, "Reward ready", "Today, 09:18", "22 visits", "May"],
  ["olivia", "Olivia Harris", "olivia@example.com", 3, "Active", "Yesterday", "8 visits", "September"],
  ["harry", "Harry Evans", "harry@example.com", 5, "Active", "Yesterday", "11 visits", "March"],
  ["amelia", "Amelia Brown", "amelia@example.com", 1, "New member", "26 Aug", "1 visit", "November"],
  ["george", "George Taylor", "george@example.com", 8, "Almost there", "25 Aug", "19 visits", "July"],
  ["isla", "Isla Thomas", "isla@example.com", 9, "Reward ready", "24 Aug", "27 visits", "February"],
  ["jack", "Jack Roberts", "jack@example.com", 4, "Active", "23 Aug", "10 visits", "April"],
  ["ava", "Ava Johnson", "ava@example.com", 6, "Active", "22 Aug", "16 visits", "December"],
  ["noah", "Noah Walker", "noah@example.com", 2, "Active", "21 Aug", "5 visits", "June"],
  ["mia", "Mia Thompson", "mia@example.com", 8, "Almost there", "19 Aug", "20 visits", "August"],
  ["leo", "Leo White", "leo@example.com", 9, "Reward ready", "18 Aug", "31 visits", "October"],
  ["lily", "Lily Hall", "lily@example.com", 5, "Active", "15 Aug", "12 visits", "March"],
  ["oscar", "Oscar Green", "oscar@example.com", 3, "Active", "12 Aug", "7 visits", "January"],
  ["freya", "Freya King", "freya@example.com", 1, "New member", "10 Aug", "1 visit", "May"],
  ["archie", "Archie Wright", "archie@example.com", 7, "Almost there", "7 Aug", "15 visits", "September"],
  ["ella", "Ella Scott", "ella@example.com", 4, "Active", "3 Aug", "9 visits", "July"],
  ["theo", "Theo Baker", "theo@example.com", 2, "Active", "30 Jul", "6 visits", "November"],
].map(([id, name, email, stamps, status, last, visits, birthday]) => ({ id, name, email, stamps, status, last, visits, birthday }));

const activity = [
  ["Sophie Turner", "Stamp added", "7 of 9 stamps", "Today · 10:42", "stamp"],
  ["James Wilson", "Reward ready", "Reached 9 of 9 stamps", "Today · 09:18", "reward"],
  ["Olivia Harris", "Joined loyalty programme", "Added card to Wallet", "Yesterday · 16:05", "joined"],
  ["Harry Evans", "Reward redeemed", "Stamp card restarted", "Yesterday · 13:27", "redeemed"],
  ["Amelia Brown", "Stamp added", "1 of 9 stamps", "Tuesday · 11:54", "stamp"],
  ["George Taylor", "Stamp count updated", "Adjusted to 8 of 9 stamps", "Monday · 15:20", "updated"],
  ["Isla Thomas", "Reward ready", "Reached 9 of 9 stamps", "Monday · 08:46", "reward"],
  ["Jack Roberts", "Stamp added", "4 of 9 stamps", "25 Aug · 14:12", "stamp"],
  ["Ava Johnson", "Joined loyalty programme", "Added card to Wallet", "24 Aug · 10:31", "joined"],
];

const reminders = [
  ["Halfway", "Customer reaches halfway to their reward.", "You’re halfway to your next reward at {merchant} ☕", "Turns early progress into momentum."],
  ["One visit away", "Customer has one visit left.", "Just one more visit until your next reward.", "Gives customers a timely reason to return."],
  ["Reward ready", "Customer earns their reward.", "You’ve earned your reward 🎉 Come and enjoy it.", "Makes sure earned rewards do not go unnoticed."],
  ["Birthday", "On the birthday saved to their profile.", "Happy Birthday 🎂 We hope to see you soon.", "Creates a personal moment customers remember."],
  ["Win-back", "No visit for the configured inactivity period.", "It’s been a while — we’d love to see you again.", "Re-engages customers after their routine slips."],
];

const initialCampaigns = [
  ["Friday Afternoon", "Pop in before 4pm today and enjoy an extra stamp ☕", "Scheduled", "Today · 2:00pm", "All loyalty customers"],
  ["New Autumn Menu", "Our autumn menu has landed. Come and find your new favourite.", "Scheduled", "2 Sep · 9:00am", "All loyalty customers"],
  ["Bank Holiday Opening", "We’re open this Bank Holiday Monday from 9am.", "Sent", "24 Aug · 4:00pm", "Delivered to 168"],
  ["Double Stamp Morning", "Double stamps on every coffee before midday today.", "Sent", "16 Aug · 8:00am", "Delivered to 161"],
].map(([name, message, status, when, audience], i) => ({ id: `campaign-${i}`, name, message, status, when, audience }));

function merchantNameFromPath(pathname) {
  const slug = pathname.split("/").filter(Boolean)[1] || "";
  if (!slug) return { slug: "pocket-stamp-demo", name: "PocketStamp Café" };
  const words = slug.split("-").filter(Boolean);
  if (!words.length || words.some((word) => !/^[a-z0-9]+$/i.test(word))) return { slug: "pocket-stamp-demo", name: "PocketStamp Café" };
  const displayWords = words.map((word) => word.toLowerCase() === "and" ? "&" : word);
  return { slug: words.join("-"), name: displayWords.join(" ").toUpperCase() };
}

const nav = [
  ["overview", "Overview", LayoutDashboard], ["customers", "Customers", Users],
  ["activity", "Activity", Activity], ["marketing", "Marketing", Megaphone],
  ["get-customers", "Get Customers", QrCode],
];

function Badge({ children, tone = "blue" }) {
  const tones = { blue: "bg-[#eaf0ff] text-[#2f6df6]", green: "bg-[#e7f7f3] text-[#16856f]", amber: "bg-amber-50 text-amber-700", grey: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function DemoNav({ page, navigate }) {
  return <nav aria-label="Demo dashboard navigation" className="space-y-1">{nav.map(([key, label, Icon]) => <button key={key} type="button" onClick={() => navigate(key)} aria-current={page === key ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${page === key ? "bg-[var(--ps-espresso)] text-white" : "text-[var(--ps-muted)] hover:bg-white hover:text-[var(--ps-espresso)]"}`}><Icon size={17}/>{label}</button>)}</nav>;
}

function Overview({ navigate }) {
  const metrics = [["Loyalty members", "184", "Customers joined", Users], ["Active customers", "73", "Visited in the last 30 days", CircleUserRound], ["Stamps collected", "1,246", "Across all loyalty cards", Stamp], ["Rewards redeemed", "31", "Completed redemptions", Gift]];
  return <div className="space-y-7">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, helper, Icon]) => <div key={label} className="ps-dashboard-card rounded-2xl p-5"><div className="flex justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--ps-muted)]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-1.5 text-sm text-[var(--ps-muted)]">{helper}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ps-blue-soft)] text-[var(--ps-blue)]"><Icon size={19}/></span></div></div>)}</section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.55fr)]">
      <section><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold">Recent activity</h2><p className="mt-1 text-sm text-[var(--ps-muted)]">The latest activity from your loyalty programme.</p></div><button onClick={() => navigate("activity")} className="text-sm font-semibold text-[var(--ps-blue)]">View all</button></div><ActivityList rows={activity.slice(0,5)}/></section>
      <aside className="space-y-4"><div className="rounded-2xl bg-[#143d3b] p-5 text-white"><BellRing size={22}/><h2 className="mt-4 text-xl font-semibold">Automatic reminders</h2><p className="mt-2 text-sm leading-6 text-white/75">Five helpful moments are active and ready to bring customers back.</p><button onClick={() => navigate("marketing")} className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#143d3b]">Explore reminders</button></div><div className="ps-dashboard-card rounded-2xl p-5"><div className="flex items-center justify-between"><div><p className="font-semibold">Scanner</p><p className="mt-1 text-sm text-[var(--ps-muted)]">Counter tablet</p></div><Badge tone="green"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"/>Connected</Badge></div><p className="mt-4 text-xs leading-5 text-[var(--ps-muted)]">Read-only demo status. Provisioning controls are hidden.</p></div></aside>
    </div>
  </div>;
}

function ActivityList({ rows }) { return <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">{rows.map(([name, title, detail, time, kind]) => <div key={`${name}-${time}`} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{name}</p><p className="mt-1 text-sm text-slate-600">{title} · {detail}</p><p className="mt-1 text-sm text-slate-400">{time}</p></div><Badge tone={kind === "reward" || kind === "redeemed" ? "amber" : "green"}>{title}</Badge></div>)}</div>; }

function Customers() {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("All"); const [selected, setSelected] = useState(null); const [page, setPage] = useState(1);
  const filtered = customers.filter(c => (!query || `${c.name} ${c.email}`.toLowerCase().includes(query.toLowerCase())) && (filter === "All" || c.status === filter));
  const pages = Math.max(1, Math.ceil(filtered.length / 8)); const safePage = Math.min(page, pages); const shown = filtered.slice((safePage-1)*8, safePage*8);
  const changeFilter = value => { setFilter(value); setPage(1); setSelected(null); };
  return <section><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h2 className="text-2xl font-semibold">Loyalty customers</h2><p className="mt-1 text-sm text-[var(--ps-muted)]">Search customer progress and open a profile for more detail.</p></div><label className="relative w-full md:max-w-sm"><Search className="absolute left-4 top-3.5 text-slate-400" size={18}/><input value={query} onChange={e => {setQuery(e.target.value); setPage(1)}} className="ps-input w-full pl-11" type="search" placeholder="Search by name or email" aria-label="Search customers"/></label></div><div className="mt-4 flex flex-wrap gap-2">{["All","Almost there","Reward ready","New member"].map(item => <button key={item} onClick={() => changeFilter(item)} className={`rounded-full px-3 py-2 text-sm font-semibold ${filter === item ? "bg-[#143d3b] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{item}</button>)}</div>
    <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">{shown.length ? shown.map(c => <div key={c.id} className="border-b border-slate-100 last:border-0"><button type="button" onClick={() => setSelected(selected === c.id ? null : c.id)} className="grid w-full gap-3 p-4 text-left hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"><span><span className="block font-semibold">{c.name}</span><span className="mt-1 block text-sm text-slate-500">{c.email}</span></span><span className="flex flex-wrap items-center gap-2"><Badge tone="grey">{c.stamps}/9 stamps</Badge><Badge tone={c.status === "Reward ready" ? "amber" : "green"}>{c.status}</Badge><span className="text-sm text-slate-400">{c.last}</span><ChevronDown size={17} className={selected === c.id ? "rotate-180" : ""}/></span></button>{selected === c.id && <div className="grid gap-4 border-t border-slate-100 bg-[#fbfaf7] px-5 py-4 sm:grid-cols-3">{[["Total visits",c.visits],["Birthday month",c.birthday],["Marketing","Opted in"]].map(([l,v]) => <div key={l}><p className="text-xs font-semibold text-slate-400">{l}</p><p className="mt-1 text-sm font-semibold">{v}</p></div>)}</div>}</div>) : <p className="p-8 text-center text-slate-500">No demo customers match your search.</p>}</div>
    {pages > 1 && <div className="mt-4 flex items-center justify-between"><p className="text-sm text-slate-500">Page {safePage} of {pages}</p><div className="flex gap-2"><button disabled={safePage === 1} onClick={() => setPage(safePage-1)} className="ps-button-secondary disabled:opacity-40">Previous</button><button disabled={safePage === pages} onClick={() => setPage(safePage+1)} className="ps-button-secondary disabled:opacity-40">Next</button></div></div>}
  </section>;
}

function ActivityPage() { const [filter,setFilter]=useState("All"); const filtered = filter === "All" ? activity : activity.filter(row => row[1] === filter); return <section><h2 className="text-2xl font-semibold">Customer activity</h2><p className="mt-1 text-sm text-[var(--ps-muted)]">A timeline of loyalty moments across the programme.</p><div className="my-5 flex flex-wrap gap-2">{["All","Stamp added","Reward ready","Reward redeemed","Joined loyalty programme"].map(x=><button key={x} onClick={()=>setFilter(x)} className={`rounded-full px-3 py-2 text-sm font-semibold ${filter===x?"bg-[#143d3b] text-white":"bg-white text-slate-600 ring-1 ring-slate-200"}`}>{x}</button>)}</div><ActivityList rows={filtered}/></section>; }

function Marketing({ merchantName }) {
  const [tab,setTab]=useState("reminders"); const [open,setOpen]=useState("Halfway"); const [campaigns,setCampaigns]=useState(initialCampaigns); const [creating,setCreating]=useState(false); const [confirmation,setConfirmation]=useState(false); const [form,setForm]=useState({name:"",message:"",audience:"All loyalty customers",schedule:"Tomorrow · 10:00am"});
  function submit(e){e.preventDefault(); setCampaigns([{id:`local-${Date.now()}`,name:form.name,message:form.message,status:"Scheduled",when:form.schedule,audience:form.audience},...campaigns]);setCreating(false);setConfirmation(true);setForm({name:"",message:"",audience:"All loyalty customers",schedule:"Tomorrow · 10:00am"});}
  return <section><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold">Marketing</h2><p className="mt-1 text-sm text-[var(--ps-muted)]">Bring customers back automatically or schedule a one-off update.</p></div><div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200"><button onClick={()=>setTab("reminders")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab==="reminders"?"bg-[#143d3b] text-white":"text-slate-600"}`}>Reminders</button><button onClick={()=>setTab("campaigns")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab==="campaigns"?"bg-[#143d3b] text-white":"text-slate-600"}`}>Campaigns</button></div></div>
    {tab === "reminders" ? <div className="mt-6"><div className="rounded-2xl bg-[#eaf0ff] p-5 sm:flex sm:items-center sm:gap-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#2f6df6]"><Sparkles size={21}/></span><div className="mt-3 sm:mt-0"><h3 className="font-semibold">Build repeat habits, automatically</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">PocketStamp can automatically reach customers through the loyalty card already in their Wallet — helping turn occasional visits into repeat habits.</p></div></div><div className="mt-5 grid gap-3">{reminders.map(([name,trigger,message,why])=><div key={name} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"><button className="flex w-full items-center justify-between gap-3 p-5 text-left" onClick={()=>setOpen(open===name?null:name)}><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f7f3] text-[#16856f]"><BellRing size={17}/></span><span><span className="font-semibold">{name}</span><span className="mt-1 block text-sm text-slate-500">{trigger}</span></span></span><span className="flex items-center gap-3"><Badge tone="green"><Check size={12} className="mr-1"/>Active</Badge><ChevronDown size={18} className={open===name?"rotate-180":""}/></span></button>{open===name&&<div className="grid gap-4 border-t border-slate-100 bg-[#fbfaf7] p-5 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wallet message example</p><div className="mt-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#143d3b] text-[10px] font-bold text-white">PS</span><span className="text-xs font-semibold">{merchantName}</span><span className="ml-auto text-[11px] text-slate-400">now</span></div><p className="mt-3 text-sm leading-6">{message.replace("{merchant}",merchantName)}</p></div></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Why it helps</p><p className="mt-2 text-sm leading-6 text-slate-600">{why}</p><p className="mt-3 text-xs text-slate-400">Trigger: {trigger}</p></div></div>}</div>)}</div></div> : <div className="mt-6">
      <div className="flex justify-end"><button onClick={()=>{setCreating(true);setConfirmation(false)}} className="ps-button-primary"><Megaphone size={17}/>Create campaign</button></div>{confirmation&&<div role="status" className="mt-4 flex items-start gap-3 rounded-2xl bg-[#e7f7f3] p-4 text-[#116b5b]"><Check className="mt-0.5" size={19}/><div><p className="font-semibold">Demo campaign created</p><p className="mt-1 text-sm">No messages were sent. This campaign exists only until you refresh.</p></div></div>}
      {creating&&<form onSubmit={submit} className="mt-4 grid gap-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:grid-cols-[1fr_20rem]"><div className="grid gap-4"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Create campaign</h3><button type="button" aria-label="Close form" onClick={()=>setCreating(false)}><X size={20}/></button></div><label className="text-sm font-semibold">Campaign name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="ps-input mt-2 w-full" placeholder="e.g. Friday Afternoon"/></label><label className="text-sm font-semibold">Message<textarea required maxLength={90} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="ps-input mt-2 min-h-24 w-full resize-none" placeholder="Write a short Wallet message"/><span className="mt-1 block text-right text-xs font-normal text-slate-400">{form.message.length}/90</span></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Audience<select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})} className="ps-input mt-2 w-full"><option>All loyalty customers</option><option>Active customers</option><option>Customers with a reward</option></select></label><label className="text-sm font-semibold">Schedule<select value={form.schedule} onChange={e=>setForm({...form,schedule:e.target.value})} className="ps-input mt-2 w-full"><option>Today · 2:00pm</option><option>Tomorrow · 10:00am</option><option>Friday · 3:00pm</option></select></label></div><button className="ps-button-primary w-fit" type="submit"><Send size={17}/>Schedule demo campaign</button></div><aside><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wallet preview</p><div className="mt-2 rounded-[2rem] bg-slate-950 p-3 shadow-xl"><div className="rounded-[1.4rem] bg-white p-4"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#143d3b] text-xs font-bold text-white">PS</span><div><p className="text-xs font-semibold text-slate-900">{merchantName}</p><p className="text-[11px] text-slate-400">now</p></div></div><p className="mt-4 min-h-16 text-sm leading-6 text-slate-700">{form.message||"Your campaign message will appear here."}</p></div></div><p className="mt-3 text-center text-xs text-slate-400">Preview only · nothing will be sent</p></aside></form>}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"><div className="border-b border-slate-100 p-5"><h3 className="font-semibold">Campaign history</h3></div>{campaigns.map(c=><button key={c.id} type="button" onClick={()=>{setForm({...form,name:c.name,message:c.message});setCreating(true);setConfirmation(false)}} className="flex w-full flex-col gap-3 border-b border-slate-100 p-5 text-left last:border-0 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"><span><span className="font-semibold">{c.name}</span><span className="mt-1 block text-sm text-slate-500">{c.message}</span><span className="mt-1 block text-xs text-slate-400">{c.when} · {c.audience}</span></span><Badge tone={c.status==="Sent"?"green":"blue"}>{c.status}</Badge></button>)}</div>
    </div>}
  </section>;
}

function GetCustomers({ merchantName, slug }) { const joinUrl=`${SITE_URL}/join/${slug}`; const [copied,setCopied]=useState(false); async function copy(){try{await navigator.clipboard.writeText(joinUrl);setCopied(true);setTimeout(()=>setCopied(false),1600)}catch{setCopied(false)}} return <div className="grid gap-6 xl:grid-cols-[1fr_22rem]"><section className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200"><QrCode className="mx-auto text-[#2f6df6]"/><h2 className="mt-4 text-2xl font-semibold">Customer Join QR</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Customers scan this at the counter to join {merchantName}’s loyalty programme.</p><div className="mx-auto mt-6 max-w-[280px] rounded-2xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100"><QRCodeSVG value={joinUrl} size={240} level="M" includeMargin className="h-auto w-full" title={`QR code for ${joinUrl}`}/></div><p className="mx-auto mt-5 max-w-xl break-all rounded-xl bg-[#fbfaf7] p-3 text-sm font-semibold">{joinUrl}</p><div className="mt-4 flex justify-center gap-3"><button onClick={copy} className="ps-button-primary">{copied?"Link copied":"Copy link"}</button><a href={`/join/${slug}`} target="_blank" rel="noreferrer" className="ps-button-secondary">Open join page</a></div></section><aside className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"><WalletCards className="text-[#16856f]"/><h2 className="mt-4 text-xl font-semibold">From scan to Wallet</h2><ol className="mt-5 space-y-5">{[["1","Scan the QR","No app download needed."],["2","Enter details","A quick customer-facing form."],["3","Add to Wallet","Their loyalty card is ready to scan."]].map(([n,t,d])=><li key={n} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf0ff] text-xs font-bold text-[#2f6df6]">{n}</span><span><strong className="block text-sm">{t}</strong><span className="mt-1 block text-sm text-slate-500">{d}</span></span></li>)}</ol></aside></div>; }

export default function MerchantDashboardDemo() {
  const merchant = useMemo(()=>merchantNameFromPath(window.location.pathname),[]); const [page,setPage]=useState("overview"); const [menu,setMenu]=useState(false);
  useEffect(() => {
    const existingRobots = document.querySelector('meta[name="robots"]');
    const robots = existingRobots || document.createElement("meta");
    const previousContent = existingRobots?.getAttribute("content");
    if (!existingRobots) {
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");
    return () => {
      if (!existingRobots) robots.remove();
      else if (previousContent === null) robots.removeAttribute("content");
      else robots.setAttribute("content", previousContent);
    };
  }, []);
  function navigate(next){setPage(next);setMenu(false);window.scrollTo({top:0,behavior:"smooth"})}
  const titles={overview:"Overview",customers:"Customers",activity:"Activity",marketing:"Marketing","get-customers":"Get Customers"};
  return <main className="ps-dashboard min-h-screen text-[var(--ps-espresso)]"><div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]"><aside className="hidden border-r border-[var(--ps-border)] bg-[rgba(255,253,248,.86)] p-5 lg:flex lg:min-h-screen lg:flex-col lg:sticky lg:top-0 lg:h-screen"><a href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ps-espresso)] text-sm font-bold text-white">PS</span><span className="font-semibold">PocketStamp</span></a><div className="mt-6"><p className="truncate font-semibold">{merchant.name}</p><p className="mt-1 text-xs text-[var(--ps-muted)]">Loyalty dashboard</p><Badge>Interactive demo</Badge></div><div className="mt-6"><DemoNav page={page} navigate={navigate}/></div><div className="mt-auto space-y-3 border-t border-[var(--ps-border)] pt-5"><div className="rounded-xl bg-white p-3 ring-1 ring-[var(--ps-border)]"><p className="text-xs font-semibold">Scanner connected</p><p className="mt-1 text-xs text-[var(--ps-muted)]">Demo status · no setup controls</p></div><a href="/#contact" className="block rounded-xl bg-[var(--ps-blue)] px-4 py-3 text-center text-sm font-semibold text-white">Interested in PocketStamp?</a><a href="/" className="flex items-center gap-2 px-2 text-sm font-semibold text-[var(--ps-muted)]"><ArrowLeft size={15}/>Back to PocketStamp</a></div></aside>
    <div className="min-w-0"><header className="border-b border-[var(--ps-border)] bg-[rgba(255,253,248,.94)] lg:hidden"><div className="flex items-center justify-between px-5 py-4"><span className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-espresso)] text-xs font-bold text-white">PS</span><span className="min-w-0"><span className="block font-semibold">PocketStamp</span><span className="block truncate text-xs text-[var(--ps-muted)]">{merchant.name}</span></span></span><button aria-label="Toggle navigation" onClick={()=>setMenu(!menu)} className="rounded-xl border border-[var(--ps-border)] bg-white p-2.5">{menu?<X size={20}/>:<Menu size={20}/>}</button></div>{menu&&<div className="border-t border-[var(--ps-border)] px-5 py-4"><DemoNav page={page} navigate={navigate}/><div className="mt-4 grid grid-cols-2 gap-2"><a href="/" className="ps-button-secondary justify-center">Back to site</a><a href="/#contact" className="ps-button-primary justify-center">Get in touch</a></div></div>}</header>
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><p className="text-sm font-semibold uppercase tracking-wide text-[var(--ps-blue)]">PocketStamp Merchant</p><Badge>Demo dashboard</Badge></div><h1 className="mt-2 text-3xl font-semibold">{titles[page]}</h1><p className="mt-1 text-sm text-[var(--ps-muted)]">{merchant.name} · Fictional demonstration data</p></div>{page!=="marketing"&&<button onClick={()=>navigate("marketing")} className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200 sm:self-auto"><BellRing size={16} className="text-[#2f6df6]"/>See automatic reminders</button>}</div>
        {page==="overview"&&<Overview navigate={navigate}/>} {page==="customers"&&<Customers/>} {page==="activity"&&<ActivityPage/>} {page==="marketing"&&<Marketing merchantName={merchant.name}/>} {page==="get-customers"&&<GetCustomers merchantName={merchant.name} slug={merchant.slug}/>}<footer className="mt-12 border-t border-[var(--ps-border)] py-6 text-center text-xs text-[var(--ps-muted)]">Interactive PocketStamp demo · All dashboard figures and customer activity are fictional.</footer></div></div></div></main>;
}
