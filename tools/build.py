"""Assemble src/*.html into the final pages at the project root (shared head, nav and footer)."""
import os, re, html

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "src")

MENU = [
    ("coffee", "Rose Latte", "Double shot, rose and cardamom milk, heart on top", 260, "Signature"),
    ("coffee", "Pink Velvet Mocha", "Espresso, white chocolate, beetroot pink, whipped cream", 280, ""),
    ("coffee", "Classic Cappuccino", "Our house blend, silky foam, a dusting of cocoa", 220, ""),
    ("coffee", "Cortado", "Equal parts espresso and warm milk, small and strong", 200, ""),
    ("coffee", "Cold Brew Tonic", "18 hour cold brew over tonic and a slice of orange", 240, ""),
    ("coffee", "Pour Over of the Week", "Single estate from Chikmagalur, ask what's brewing", 250, ""),
    ("nocoffee", "Strawberry Matcha", "Ceremonial matcha layered over strawberry milk", 270, "New"),
    ("nocoffee", "Hibiscus Iced Tea", "Steeped hibiscus, lime and a little honey", 190, ""),
    ("nocoffee", "Rose Hot Chocolate", "Dark chocolate, rose syrup, marshmallow", 230, ""),
    ("nocoffee", "Masala Chai", "Assam leaves, fresh ginger, slow cooked with spices", 150, ""),
    ("bakes", "Raspberry Macarons", "Three shells, raspberry and white chocolate ganache", 210, ""),
    ("bakes", "Strawberry Shortcake", "Vanilla sponge, fresh cream, strawberries", 240, "Bestseller"),
    ("bakes", "Butter Croissant", "Laminated over three days, baked at 6 am", 160, ""),
    ("bakes", "Pistachio Rose Cake", "Pistachio sponge, rose cream, dried petals", 260, "This month"),
    ("bakes", "Almond Biscotti", "Twice baked, perfect for dunking", 120, ""),
    ("plates", "Avocado Sourdough Toast", "Smashed avocado, chilli flakes, poached egg", 320, ""),
    ("plates", "Pesto Grilled Sandwich", "Basil pesto, mozzarella, roasted peppers", 290, ""),
    ("plates", "Truffle Mushroom Toast", "Garlic mushrooms, truffle oil, parmesan", 340, ""),
    ("plates", "Pink Pasta", "Beetroot cream sauce, goat cheese, toasted walnuts", 360, ""),
]

FAQS = [
    ("Do I need to book?", "No, walk-ins are always welcome. Booking helps on Friday and Saturday evenings and for groups of five or more."),
    ("Do you have vegan options?", "Yes. Oat and almond milk are available for every drink, and the hibiscus tea, masala chai with oat milk, biscotti and pink pasta without cheese are fully vegan."),
    ("Can I work from the café?", "Of course. There is free Wi-Fi and plenty of sockets along the window wall. On weekend evenings we ask laptop users to share the big tables."),
    ("Is the café pet friendly?", "Dogs are welcome in the garden seating at the back. We keep water bowls and a jar of dog biscuits by the door."),
    ("Do you host private events?", "Yes, the garden can be booked for birthdays and small gatherings of up to 20 people. Email us with the date and we'll send options."),
]

def menu_items():
    out = []
    for cat, name, desc, price, tag in MENU:
        t = f'<span class="ml-2 rounded-full bg-blush px-2.5 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wider text-rose-deep">{tag}</span>' if tag else ""
        out.append(f'''<div class="menu-item flex items-baseline gap-4 border-b border-cocoa/10 py-6" data-cat="{cat}">
        <div class="flex-1"><p class="font-display text-2xl font-extrabold">{html.escape(name)}{t}</p><p class="mt-1 text-cocoa/60">{html.escape(desc)}</p></div>
        <p class="font-display text-xl font-extrabold">₹{price}</p></div>''')
    return "\n      ".join(out)

def faqs():
    return "\n      ".join(f'''<div class="faq" data-reveal>
        <button class="flex w-full items-center justify-between gap-6 py-6 text-left" aria-expanded="false"><span class="font-display text-xl font-extrabold md:text-2xl">{html.escape(q)}</span><span class="plus text-3xl font-light text-rose-deep" aria-hidden="true">+</span></button>
        <div class="faq-a"><div><p class="pb-6 pr-10 text-lg text-cocoa/70">{html.escape(a)}</p></div></div></div>''' for q, a in FAQS)

head = open(os.path.join(SRC, "_head.html"), encoding="utf-8").read()
foot = open(os.path.join(SRC, "_foot.html"), encoding="utf-8").read()
for page in ("index", "menu", "about", "contact"):
    raw = open(os.path.join(SRC, page + ".html"), encoding="utf-8").read()
    meta, body = re.match(r"---\n(.*?)\n---\n(.*)", raw, re.S).groups()
    m = dict(l.split(":", 1) for l in meta.splitlines())
    m = {k.strip(): v.strip() for k, v in m.items()}
    h = head.replace("{{title}}", html.escape(m["title"])).replace("{{desc}}", html.escape(m["desc"])).replace("{{bodyclass}}", m.get("bodyclass", ""))
    for p in ("home", "menu", "about", "contact"):
        h = h.replace("{{cur_%s}}" % p, 'aria-current="page"' if m["cur"] == p else "")
    body = body.replace("{{menu_items}}", menu_items()).replace("{{faqs}}", faqs())
    f = foot.replace("{{scripts}}", '<script src="assets/js/pages.js"></script>')
    open(os.path.join(ROOT, page + ".html"), "w", encoding="utf-8").write(h + body + f)
    print("built", page + ".html")
