// The hero's terminal ("Fig. 1") turns into a little shell once its intro has typed itself out.
// Visitors can list and open projects, read about Charles and boss Pip around (`pip mint`, `pip say hi`).
// Everything is built from the showcase data the page embeds in <script id="shell-data">, so new repos
// show up here by themselves. Pip listens for "pip" events on window (src/components/Pip.astro).

export interface ShellProject {
  name: string;
  title: string;
  tagline: string;
  url: string | null;
  live: string | null;
  featured: boolean;
  downloads: string[];
}

export interface ShellData {
  github: string;
  projects: ShellProject[];
}

type Out = string | Node | (string | Node)[];

const COMMANDS = ["help", "ls", "open", "cd", "play", "cat", "log", "about", "pip", "github", "whoami", "clear", "history", "date", "echo", "pwd"];
const PIP_ACTIONS = ["say", "wave", "jump", "spin", "flavours"];
const HELP: [string, string][] = [
  ["ls", "list the projects"],
  ["open <project>", "open its page (cd works too)"],
  ["play <project>", "play it in your browser"],
  ["log", "what I've been changing lately"],
  ["cat about.md", "a bit about me (or: about)"],
  ["pip [flavour]", "poke Pip, or pick his flavour"],
  ["pip say <words>", "make Pip say something"],
  ["github", "my GitHub"],
  ["clear", "tidy up"],
];

export function mountShell(body: HTMLElement, data: ShellData) {
  const promptLine = body.querySelector<HTMLElement>("[data-shell-prompt]");
  const pipCanvas = document.getElementById("pip");
  if (!promptLine) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flavours = (pipCanvas?.dataset.flavours ?? "").split(" ").filter(Boolean);
  const history: string[] = [];
  let cursor = 0;

  // ---------- markup ----------
  const log = document.createElement("div");
  log.className = "shell__log";
  log.setAttribute("role", "log");
  log.setAttribute("aria-label", "Terminal output");
  promptLine.before(log);

  const form = document.createElement("form");
  form.className = "shell__form";
  form.innerHTML =
    '<label class="visually-hidden" for="shell-input">Type a command into the terminal</label>' +
    '<input id="shell-input" class="shell__input" type="text" autocomplete="off" autocapitalize="off" ' +
    'spellcheck="false" enterkeyhint="go" placeholder="type help" />' +
    '<span class="cursor" aria-hidden="true"></span>';
  const input = form.querySelector("input")!;
  promptLine.querySelector(".cursor")?.remove();
  promptLine.append(form);
  body.classList.add("shell");

  // ---------- output ----------
  const prompt = (who: string) => {
    const p = document.createElement("span");
    p.className = "prompt";
    p.innerHTML = `${who}@workshop<span class="prompt__path">:~</span><span class="prompt__sym">$</span>`;
    return p;
  };

  const print = (out: Out, cls = "terminal__out") => {
    const line = document.createElement("p");
    line.className = `terminal__line ${cls}`.trim();
    line.append(...(Array.isArray(out) ? out : [out]));
    log.append(line);
  };

  const link = (text: string, href: string, external = false) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    if (external) a.rel = "noopener";
    return a;
  };

  const strong = (text: string) => {
    const b = document.createElement("b");
    b.className = "shell__em";
    b.textContent = text;
    return b;
  };

  // ---------- helpers ----------
  const find = (q: string) => {
    const s = q.toLowerCase().replace(/^~\/(projects\/)?/, "").replace(/\/$/, "");
    if (!s) return undefined;
    return (
      data.projects.find((p) => p.name.toLowerCase() === s || p.title.toLowerCase() === s) ??
      data.projects.find((p) => p.name.toLowerCase().startsWith(s) || p.title.toLowerCase().startsWith(s))
    );
  };

  const pointAt = (el: HTMLElement) => {
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    el.classList.add("is-pointed");
    setTimeout(() => el.classList.remove("is-pointed"), 1800);
    // The terminal is off screen now; let go of the keyboard on phones.
    input.blur();
  };

  const go = (href: string, label: string) => {
    print(`→ ${label}`);
    body.scrollTop = body.scrollHeight;
    setTimeout(() => location.assign(href), reduced ? 0 : 350);
  };

  const pagePath = (p: ShellProject) => `/projects/${encodeURIComponent(p.name)}/`;

  const pip = (detail: { do: string; value?: string }) => window.dispatchEvent(new CustomEvent("pip", { detail }));

  const projectList = (all: boolean) => {
    const items: (string | Node)[] = [];
    const add = (node: string | Node) => {
      if (items.length) items.push("  ");
      items.push(node);
    };
    if (all) ["./", "../", ".snacks/"].forEach(add);
    data.projects.forEach((p) => add(link(`${p.name}/`, pagePath(p))));
    return items;
  };

  const notFound = (what: string, q: string) =>
    print([`${what}: no such project: ${q}. try `, strong("ls")], "terminal__out shell__err");

  // ---------- commands ----------
  const run = (raw: string) => {
    const line = raw.trim();
    const [cmd = "", ...rest] = line.split(/\s+/);
    const arg = rest.join(" ");
    const name = cmd.toLowerCase();

    switch (name) {
      case "":
        return;
      case "help":
      case "?":
      case "man": {
        const width = Math.max(...HELP.map(([c]) => c.length)) + 2;
        print("things you can type:");
        HELP.forEach(([c, what]) => print(["  ", strong(c.padEnd(width)), what]));
        print("...and a few secrets.", "terminal__out shell__dim");
        return;
      }
      case "ls":
      case "dir":
      case "ll":
        if (/projects|^$|^-/.test(arg) || arg === "~") return print(projectList(/a/.test(arg) || name === "ll"));
        return print(`ls: ${arg}: nothing in there but dust`);
      case "open":
      case "cd": {
        if (!arg || arg === "~" || arg === "..") return print(name === "cd" ? "you're already home." : ["open what? try ", strong("open pip")]);
        if (arg === "/") return print("nope, Pip guards the root directory.");
        if (/^(about|about\.md)$/i.test(arg)) return go("/about/", "about me");
        if (/^log\/?$/i.test(arg)) return go("/log/", "the workshop log");
        const p = find(arg);
        if (!p) return notFound(name, arg);
        return go(pagePath(p), `opening ${p.title}`);
      }
      case "log":
      case "git":
        if (name === "git" && !/^log/.test(arg)) return print(["git: try ", strong("git log"), " (or just ", strong("log"), ")"]);
        return go("/log/", "the workshop log");
      case "about":
        return go("/about/", "about me");
      case "play":
      case "run":
      case "start": {
        if (!arg) return print(["play what? try ", strong(`play ${(data.projects.find((p) => p.live) ?? data.projects[0])?.name ?? "something"}`)]);
        const p = find(arg);
        if (!p) return notFound(name, arg);
        const card = document.getElementById(`project-${p.name}`);
        const demo = card?.querySelector<HTMLButtonElement>("[data-embed]:not([hidden])");
        if (card && demo) {
          if (!card.querySelector(".spotlight__frame")) demo.click();
          pointAt(card);
          return print(`→ loading ${p.title}, have fun!`);
        }
        if (p.live) {
          window.open(p.live, "_blank", "noopener");
          return print(["→ opening ", link(p.live, p.live, true)]);
        }
        if (p.downloads.length) return print([`${p.title} lives on your desktop, not in a browser. grab it for ${p.downloads.join(" or ")}: `, strong(`open ${p.name}`)]);
        return print(`${p.title} doesn't run in a browser (yet).`);
      }
      case "cat":
      case "less":
      case "more": {
        const file = arg.toLowerCase();
        if (!file) return print("cat: meow?");
        if (/^(about|about\.md|readme|readme\.md)$/.test(file)) {
          return print([
            "I'm Charles. I build little things for fun, mostly by vibe coding: " +
              "I describe it, an AI helps write it, and we go back and forth until it feels right. ",
            link("more about me", "#about"),
          ]);
        }
        if (/^\.?snacks/.test(file)) return print("chips. more chips. one suspicious jellybean (don't tell Pip).");
        const p = find(file.replace(/\/readme(\.md)?$/, ""));
        if (p) return print(p.tagline || `${p.title}: no README yet.`);
        return print(`cat: ${arg}: no such file`);
      }
      case "pip": {
        const [sub = "", ...words] = rest;
        const s = sub.toLowerCase();
        if (!pipCanvas) return print("Pip has wandered off somewhere.");
        if (!s) { pip({ do: "poke" }); return print("*boop*"); }
        if (s === "say") {
          const text = words.join(" ").slice(0, 40);
          if (!text) return print(["say what? try ", strong("pip say hello")]);
          pip({ do: "say", value: text });
          return print(`Pip says "${text}"`);
        }
        if (s === "wave" || s === "jump" || s === "spin") {
          pip({ do: s });
          return print(s === "spin" ? "Pip is a little dizzy now." : `Pip ${s}s!`);
        }
        if (s === "flavours" || s === "flavors" || s === "list" || s === "help") {
          print(`flavours: ${flavours.join(", ")}`);
          return print(["try ", strong(`pip ${flavours[(Math.random() * flavours.length) | 0] ?? "lime"}`)]);
        }
        const f = flavours.find((fl) => fl === s.replace(/[\s-]/g, "")) ?? flavours.find((fl) => fl.startsWith(s));
        if (f) {
          pip({ do: "flavour", value: f });
          return print(`Pip is ${f} flavoured now. (he'll remember)`);
        }
        return print([`Pip doesn't come in ${sub}. try `, strong("pip flavours")], "terminal__out shell__err");
      }
      case "github":
      case "gh":
        return print(["→ ", link(data.github.replace(/^https?:\/\//, ""), data.github)]);
      case "whoami":
        return print("a very welcome visitor. (I'm charles, by the way.)");
      case "pwd":
        return print("/home/you/workshop");
      case "date":
        return print(new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" }));
      case "echo":
        return print(arg);
      case "history":
        history.forEach((h, i) => print(`${String(i + 1).padStart(3)}  ${h}`));
        return;
      case "clear":
      case "cls":
        log.replaceChildren();
        [...body.children].forEach((el) => {
          if (el !== log && el !== promptLine) el.remove();
        });
        return;
      // ---------- the secrets ----------
      case "sudo":
        return print("you're not in the sudoers file. This incident will be reported to Pip.");
      case "rm":
        return print("rm: Pip is sitting on that. Nothing was deleted.");
      case "exit":
      case "quit":
      case "logout":
        return print("there's no leaving the workshop. (the back button works, though)");
      case "hi":
      case "hello":
      case "hey":
      case "g'day":
        pip({ do: "wave" });
        return print("hi! Pip says hi too.");
      case "coffee":
      case "tea":
      case "make":
        return print("418: I'm a teapot.");
      case "vim":
      case "vi":
      case "nano":
      case "emacs":
        return print(["you'd never get out. try ", strong("help"), " instead."]);
      case "hamster":
        return print(["the hamster is busy running the wheel. try ", strong("play hamster-slots")]);
      case "ping":
        return print("pong");
      case "uname":
        return print("WorkshopOS 2026.10 (blueprint)");
      default: {
        const p = find(name);
        if (p) return print(["did you mean ", strong(`open ${p.name}`), "?"]);
        return print(["command not found: ", cmd, ". try ", strong("help")], "terminal__out shell__err");
      }
    }
  };

  // ---------- typing ----------
  const complete = () => {
    const value = input.value;
    const words = value.split(/\s+/);
    const last = words[words.length - 1].toLowerCase();
    const first = words[0].toLowerCase();
    let options: string[];
    if (words.length === 1) options = COMMANDS;
    else if (["open", "cd", "play", "run", "cat"].includes(first) && words.length === 2)
      options = data.projects.map((p) => p.name).concat(first === "cat" ? ["about.md"] : first === "open" || first === "cd" ? ["about", "log"] : []);
    else if (first === "pip" && words.length === 2) options = PIP_ACTIONS.concat(flavours);
    else return;
    const hits = options.filter((o) => o.startsWith(last));
    if (!hits.length) return;
    if (hits.length === 1) {
      words[words.length - 1] = hits[0];
      input.value = words.join(" ") + " ";
      return;
    }
    // Fill in what they share, and list the rest.
    let common = hits[0];
    for (const h of hits) while (!h.startsWith(common)) common = common.slice(0, -1);
    if (common.length > last.length) {
      words[words.length - 1] = common;
      input.value = words.join(" ");
    } else {
      print(hits.join("  "), "terminal__out shell__dim");
      body.scrollTop = body.scrollHeight;
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value;
    input.value = "";
    print([prompt("you"), value], "");
    if (value.trim()) {
      history.push(value.trim());
      cursor = history.length;
    }
    run(value);
    body.scrollTop = body.scrollHeight;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      cursor = Math.max(0, cursor - 1);
      input.value = history[cursor];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      cursor = Math.min(history.length, cursor + 1);
      input.value = history[cursor] ?? "";
    } else if (e.key === "Tab" && input.value.trim()) {
      // Tab on an empty prompt still moves focus on, so keyboard users never get stuck.
      e.preventDefault();
      complete();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      run("clear");
    }
  });

  // Clicking anywhere in the terminal puts you at the prompt (unless you're selecting text or clicking a link).
  body.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a, button, input")) return;
    if (window.getSelection()?.toString()) return;
    input.focus({ preventScroll: true });
  });
}

const el = document.querySelector<HTMLElement>("[data-shell]");
const json = document.getElementById("shell-data")?.textContent;
if (el && json) mountShell(el, JSON.parse(json) as ShellData);
