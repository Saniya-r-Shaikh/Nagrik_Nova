import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Leaf,
  LoaderCircle,
  MapPin,
  Menu,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import "./styles.css";
import Footer from "./Footer";
const api = axios.create({ baseURL: "http://localhost:5000/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("nn-token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
const useAuth = () => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("nn-user") || "null"),
  );
  const signIn = (d) => {
    localStorage.setItem("nn-token", d.token);
    localStorage.setItem("nn-user", JSON.stringify(d.user));
    setUser(d.user);
  };
  const out = () => {
    localStorage.clear();
    setUser(null);
  };
  return { user, signIn, out };
};
function App() {
  const auth = useAuth();
  return (
    <>
      <Nav auth={auth} />
      <main>
        <Routes>
          <Route path="/" element={<Home user={auth.user} />} />
          <Route path="/login" element={<Login auth={auth} />} />
          <Route path="/register" element={<Register auth={auth} />} />
          <Route
            path="/issues"
            element={
              <Require user={auth.user}>
                <Issues />
              </Require>
            }
          />
          <Route
            path="/issues/:id"
            element={
              <Require user={auth.user}>
                <Detail user={auth.user} />
              </Require>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Require user={auth.user}>
                <Dashboard user={auth.user} />
              </Require>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
function Require({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}
function Nav({ auth }) {
  const [open, setOpen] = useState(false);
  return (
    <header>
      <Link className="brand" to="/">
        <span className="brand-mark">
          <Leaf size={20} />
        </span>
        <span>
          Nagrik <i>Nova</i>
        </span>
      </Link>
      <button className="menu" onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? "show" : ""}>
        <NavLink to="/issues">Explore issues</NavLink>
        {auth.user && ["citizen", "ngo"].includes(auth.user.role) && (
          <NavLink to="/dashboard">My dashboard</NavLink>
        )}
        {auth.user ? (
          <>
            <span className="user-dot">
              {auth.user.name
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)}
            </span>
            <button className="text-btn" onClick={auth.out}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link className="btn small" to="/register">
              Join the network <ArrowRight size={15} />
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
function Home({ user }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} /> Civic intelligence, made collective
          </div>
          <h1>
            Big civic change starts with <em>one shared signal.</em>
          </h1>
          <p>
            Nagrik Nova connects community-reported challenges with the people,
            research and resources ready to solve them.
          </p>
          <div className="hero-actions">
            <Link className="btn" to={user ? "/issues" : "/register"}>
              {user ? "Explore live issues" : "Become a changemaker"}{" "}
              <ArrowRight size={17} />
            </Link>
            <a className="link-action" href="#how">
              See how it works <ChevronRight size={17} />
            </a>
          </div>
          <div className="trust">
            <span>
              <CheckCircle2 /> Community-led
            </span>
            <span>
              <CheckCircle2 /> AI-assisted
            </span>
            <span>
              <CheckCircle2 /> Outcome-focused
            </span>
          </div>
        </div>
        <div className="hero-art quiet-art" aria-label="Animated collaboration illustration">
          <div className="constellation-lines"></div>
          <div className="constellation-core"><BrainCircuit size={48} /><span>Ideas in action</span></div>
          <div className="constellation-node node-a"><span></span></div>
          <div className="constellation-node node-b"><span></span></div>
          <div className="constellation-node node-c"><span></span></div>
          <div className="constellation-label label-a">Community</div>
          <div className="constellation-label label-b">Research</div>
          <div className="constellation-label label-c">Industry</div>
          <div className="constellation-caption"><Sparkles size={16} /> Collaboration creates momentum</div>
        </div>
      </section>
      <section className="impact-strip">
        <div>
          <strong>01</strong>
          <span>Report what matters</span>
        </div>
        <div>
          <strong>02</strong>
          <span>Understand the challenge</span>
        </div>
        <div>
          <strong>03</strong>
          <span>Connect the right minds</span>
        </div>
        <div>
          <strong>04</strong>
          <span>Build local impact</span>
        </div>
      </section>
      <section id="how" className="how">
        <div className="section-intro">
          <div className="eyebrow">
            <Leaf size={15} /> From a concern to a solution
          </div>
          <h2>
            One platform. Many hands.
            <br />
            <em>Real progress.</em>
          </h2>
        </div>
        <div className="steps">
          <Step
            n="01"
            icon={<CircleAlert />}
            title="Share a civic issue"
            text="Citizens and NGOs make local needs visible with a simple, structured report."
          />
          <Step
            n="02"
            icon={<BrainCircuit />}
            title="Turn insight into clarity"
            text="AI identifies the domain, priority and expertise needed to move forward."
          />
          <Step
            n="03"
            icon={<Users />}
            title="Find the right collaborators"
            text="Universities and industry partners are matched to challenges they can help solve."
          />
        </div>
      </section>
    </>
  );
}
function Step(p) {
  return (
    <article className="step">
      <div className="step-top">
        <span>{p.n}</span>
        {p.icon}
      </div>
      <h3>{p.title}</h3>
      <p>{p.text}</p>
    </article>
  );
}
function AuthShell({ title, sub, children }) {
  return (
    <section className="auth-shell">
      <div className="auth-side">
        <div className="eyebrow">
          <Sparkles size={15} /> Join the civic network
        </div>
        <h2>
          Better cities are built <em>together.</em>
        </h2>
        <p>
          Bring lived experience, research and resources into one shared place
          for action.
        </p>
        <div className="quote">
          “A small report can become the beginning of a meaningful local
          change.”
        </div>
      </div>
      <div className="form-panel">
        <h1>{title}</h1>
        <p>{sub}</p>
        {children}
      </div>
    </section>
  );
}
function Login({ auth }) {
  const nav = useNavigate(),
    [data, setData] = useState({ email: "", password: "" }),
    [err, setErr] = useState("");
  const go = async (e) => {
    e.preventDefault();
    try {
      auth.signIn((await api.post("/auth/login", data)).data);
      nav("/issues");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not sign in.");
    }
  };
  return (
    <AuthShell
      title="Welcome back"
      sub="Sign in to continue your civic impact journey."
    >
      <form onSubmit={go}>
        <Field
          label="Email address"
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
        <Field
          label="Password"
          type="password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />
        {err && <div className="error">{err}</div>}
        <button className="btn full">
          Sign in <ArrowRight size={17} />
        </button>
        <p className="form-foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
const roleFields = {
  ngo: [
    ["areaOfWork", "Area of work"],
    ["registrationNumber", "Registration number"],
    ["yearsActive", "Years active"],
  ],
  university: [
    ["departments", "Departments (comma-separated)"],
    ["expertise", "Expertise (comma-separated)"],
    ["labsResources", "Labs & resources (comma-separated)"],
    ["interestedDomains", "Interested domains (comma-separated)"],
  ],
  industry: [
    ["industryType", "Industry type"],
    ["expertise", "Expertise (comma-separated)"],
    ["resourcesOffered", "Resources offered (comma-separated)"],
    ["interestedDomains", "Interested domains (comma-separated)"],
  ],
};
function Register({ auth }) {
  const nav = useNavigate(),
    [d, setD] = useState({ role: "citizen" }),
    [err, setErr] = useState("");
  const set = (k, v) => setD({ ...d, [k]: v });
  const submit = async (e) => {
    e.preventDefault();
    try {
      auth.signIn((await api.post("/auth/register", d)).data);
      nav("/issues");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not create account.");
    }
  };
  return (
    <AuthShell
      title="Join Nagrik Nova"
      sub="Create a profile that helps the right people find you."
    >
      <form onSubmit={submit}>
        <label>
          Account type
          <select value={d.role} onChange={(e) => set("role", e.target.value)}>
            {["citizen", "ngo", "university", "industry"].map((x) => (
              <option key={x} value={x}>
                {x[0].toUpperCase() + x.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <Field
          label={d.role === "citizen" ? "Your name" : "Organisation name"}
          value={d.name || ""}
          onChange={(e) => set("name", e.target.value)}
        />
        <div className="two">
          <Field
            label="Email address"
            type="email"
            value={d.email || ""}
            onChange={(e) => set("email", e.target.value)}
          />
          <Field
            label="Phone"
            value={d.phone || ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <Field
          label="Address"
          value={d.address || ""}
          onChange={(e) => set("address", e.target.value)}
        />
        <Field
          label="Create password"
          type="password"
          value={d.password || ""}
          onChange={(e) => set("password", e.target.value)}
        />
        {roleFields[d.role]?.map(([key, label]) => (
          <Field
            key={key}
            label={label}
            type={key === "yearsActive" ? "number" : "text"}
            value={d[key] || ""}
            onChange={(e) => set(key, e.target.value)}
          />
        ))}
        {err && <div className="error">{err}</div>}
        <button className="btn full">
          Create my profile <ArrowRight size={17} />
        </button>
        <p className="form-foot">
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
function Field({ label, ...props }) {
  return (
    <label>
      {label}
      <input required {...props} />
    </label>
  );
}
function Issues() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/issues")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Sparkles size={15} /> Community signal board
          </div>
          <h1>
            Issues asking for <em>action.</em>
          </h1>
          <p>
            Explore challenges surfaced by people who know their communities
            best.
          </p>
        </div>
        <Link className="btn" to="/dashboard">
          <Plus size={17} /> Report an issue
        </Link>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="issue-grid">
          {items.map((i) => (
            <IssueCard key={i._id} issue={i} />
          ))}
        </div>
      )}
      {!loading && !items.length && <Empty />}
    </section>
  );
}
function IssueCard({ issue }) {
  return (
    <Link to={`/issues/${issue._id}`} className="issue">
      <div className="issue-meta">
        <span className="role">{issue.submitterRole}</span>
        {issue.analyzed ? (
          <span className={`priority ${issue.priority?.toLowerCase()}`}>
            {issue.priority} priority
          </span>
        ) : (
          <span className="pending">Awaiting analysis</span>
        )}
      </div>
      <h3>{issue.title}</h3>
      <p>{issue.description}</p>
      <div className="issue-bottom">
        <span>
          <MapPin size={15} />
          {issue.location}
        </span>
        <span className="arrow-circle">
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
function Dashboard({ user }) {
  const nav = useNavigate(),
    [issues, setIssues] = useState([]),
    [data, setData] = useState({ title: "", description: "", location: "" }),
    [msg, setMsg] = useState(""),
    [err, setErr] = useState("");
  useEffect(() => {
    api
      .get("/issues")
      .then((r) =>
        setIssues(
          r.data.filter(
            (i) =>
              i.submittedBy?._id === user.id || i.submittedBy === user.id,
          ),
        )
      );
  }, [user.id]);
  const post = async (e) => {
    e.preventDefault();

    // THE GUARDRAIL:
    if (!data.title.trim() || !data.description.trim()) {
      alert("Please fill out the title and description before submitting!");
      return; 
    }

    setErr("");
    try {
      const r = await api.post("/issues", data);
      setIssues([r.data, ...issues]);
      setData({ title: "", description: "", location: "" });
      setMsg("Your issue is now visible to the Nagrik Nova network.");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not submit your report.");
    }
  };
  if (!["citizen", "ngo"].includes(user.role)) return <Navigate to="/issues" />;
  return (
    <section className="page dashboard">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Leaf size={15} /> Your neighbourhood, your voice
          </div>
          <h1>
            Make a concern <em>count.</em>
          </h1>
          <p>
            Your report can connect an everyday problem to the right
            problem-solvers.
          </p>
        </div>
      </div>
      <div className="dash-grid">
        <form className="report-form" onSubmit={post}>
          <h2>Report a civic issue</h2>
          <p>
            Be specific. Your details help partners understand where action is
            needed.
          </p>
          <Field
            label="A clear title"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
          />
          <label>
            What is happening?
            <textarea
              required
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
            />
          </label>
          <Field
            label="Where is this happening?"
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
          />
          {msg && <div className="success">{msg}</div>}
          {err && <div className="error">{err}</div>}
          <button className="btn full">
            Submit to the network <ArrowRight size={17} />
          </button>
        </form>
        <aside className="my-issues">
          <h2>
            Your reports <span>{issues.length}</span>
          </h2>
          {issues.length ? (
            issues.map((i) => <IssueCard key={i._id} issue={i} />)
          ) : (
            <Empty text="Your submitted issues will appear here." />
          )}
        </aside>
      </div>
    </section>
  );
}
function Detail({ user }) {
  const { id } = useParams(),
    [issue, setIssue] = useState(null),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  const get = () =>
    api
      .get("/issues/" + id)
      .then((r) => setIssue(r.data))
      .catch(() => setErr("This issue is no longer available."));
  useEffect(() => {
  get();
}, [id]);
  const analyze = async () => {
    setBusy(true);
    try {
      setIssue((await api.post(`/issues/${id}/analyze`)).data);
    } catch (e) {
      setErr(e.response?.data?.message || "Analysis could not be completed.");
    } finally {
      setBusy(false);
    }
  };
  if (err && !issue)
    return (
      <section className="page">
        <div className="error">{err}</div>
      </section>
    );
  if (!issue) return <Loading />;
  return (
    <section className="page detail">
      <Link className="back" to="/issues">
        ← Back to issue board
      </Link>
      <div className="detail-top">
        <div>
          <div className="issue-meta">
            <span className="role">{issue.submitterRole}</span>
            {issue.analyzed ? (
              <span className={`priority ${issue.priority?.toLowerCase()}`}>
                {issue.priority} priority
              </span>
            ) : (
              <span className="pending">Awaiting analysis</span>
            )}
          </div>
          <h1>{issue.title}</h1>
          <p className="location">
            <MapPin size={17} />
            {issue.location}
          </p>
        </div>
        {user.role === "admin" && !issue.analyzed && (
          <button className="btn analyze" disabled={busy} onClick={analyze}>
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <BrainCircuit size={18} />
            )}{" "}
            {busy ? "Analyzing signal…" : "Analyze with AI"}
          </button>
        )}
      </div>
      <article className="detail-description">
        <h2>What the community is seeing</h2>
        <p>{issue.description}</p>
      </article>
      {issue.analyzed ? (
        <Analysis issue={issue} />
      ) : (
        <div className="await">
          <BrainCircuit />
          <div>
            <h3>Waiting for civic intelligence</h3>
            <p>
              Once an administrator analyzes this issue, its priority, solution
              idea and likely partners will appear here.
            </p>
          </div>
        </div>
      )}
      {err && <div className="error">{err}</div>}
    </section>
  );
}
function Analysis({ issue }) {
  return (
    <section className="analysis">
      <div className="analysis-head">
        <div className="icon-box green">
          <BrainCircuit />
        </div>
        <div>
          <div className="eyebrow">AI civic brief</div>
          <h2>
            From signal to <em>next step.</em>
          </h2>
        </div>
      </div>
      <div className="analysis-grid">
        <div>
          <small>Domain</small>
          <strong>{issue.domain}</strong>
        </div>
        <div>
          <small>Priority</small>
          <strong>{issue.priority}</strong>
        </div>
        <div className="wide">
          <small>Required expertise</small>
          <div className="tags">
            {issue.requiredExpertise?.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="solution">
        <Sparkles size={19} />
        <div>
          <small>Suggested solution pathway</small>
          <p>{issue.solutionIdea}</p>
        </div>
      </div>
      <h2 className="partners-title">
        Potential collaborators{" "}
        <span>{issue.matchedOrganizations?.length || 0}</span>
      </h2>
      <div className="partners">
        {issue.matchedOrganizations?.map((m) => (
          <div className="partner" key={m.userId}>
            <div className="partner-icon">
              {m.role === "university" ? <Building2 /> : <Leaf />}
            </div>
            <div>
              <span className="role">{m.role}</span>
              <h3>{m.name}</h3>
              <p>Aligned on {m.expertise.join(", ")}</p>
            </div>
          </div>
        )) || (
          <p>No registered organisation currently matches this expertise.</p>
        )}
      </div>
    </section>
  );
}
function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" /> Loading civic signals…
    </div>
  );
}
function Empty({ text = "No issues have been shared yet." }) {
  return (
    <div className="empty">
      <Leaf />
      <p>{text}</p>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
