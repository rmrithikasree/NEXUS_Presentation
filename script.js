
// NEXUS PRESENTATION INTERACTIONS

// Mobile navigation
const menuButton = document.getElementById("menuButton");
const navLinks = document.querySelector(".nav-links");

menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("open");
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
    });
});


// Scroll reveal animations
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, {
    threshold: 0.12
});

document.querySelectorAll(".reveal").forEach(element => {
    revealObserver.observe(element);
});


// Scroll progress and active section navigation
const progressBar = document.getElementById("progressBar");
const sections = document.querySelectorAll("main section");
const indicatorLinks = document.querySelectorAll(".side-indicator a");
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0
        ? (window.scrollY / scrollable) * 100
        : 0;

    progressBar.style.width = progress + "%";

    backToTop.classList.toggle("visible", window.scrollY > 500);

    let currentSection = "";

    sections.forEach(section => {
        const top = section.offsetTop - 180;

        if (window.scrollY >= top) {
            currentSection = section.id;
        }
    });

    indicatorLinks.forEach(link => {
        link.classList.toggle(
            "active",
            link.getAttribute("href") === "#" + currentSection
        );
    });
});

backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});


// Keyboard navigation using arrow keys
const presentationSections = [...document.querySelectorAll("main section")];

document.addEventListener("keydown", (event) => {
    const tag = document.activeElement.tagName;

    if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)) {
        return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
    }

    const currentPosition = window.scrollY + window.innerHeight * 0.35;

    let currentIndex = 0;

    presentationSections.forEach((section, index) => {
        if (currentPosition >= section.offsetTop) {
            currentIndex = index;
        }
    });

    if (event.key === "ArrowDown") {
        currentIndex = Math.min(
            currentIndex + 1,
            presentationSections.length - 1
        );
    } else {
        currentIndex = Math.max(currentIndex - 1, 0);
    }

    presentationSections[currentIndex].scrollIntoView({
        behavior: "smooth"
    });
});


// ROUTE PLANNER DEMO

const locations = {
    G: { name: "Guwahati", x: 110, y: 125 },
    S: { name: "Shillong", x: 260, y: 170 },
    I: { name: "Imphal", x: 360, y: 285 },
    K: { name: "Kohima", x: 430, y: 100 },
    A: { name: "Aizawl", x: 520, y: 310 }
};

// Illustrative demo road data.
// Weights are demonstration units, not actual kilometres or travel times.
const roads = [
    { from: "G", to: "S", cost: 20, status: "safe" },
    { from: "S", to: "K", cost: 25, status: "blocked" },
    { from: "S", to: "I", cost: 25, status: "safe" },
    { from: "I", to: "K", cost: 35, status: "safe" },
    { from: "I", to: "A", cost: 40, status: "risky" },
    { from: "A", to: "K", cost: 45, status: "safe" },
    { from: "G", to: "A", cost: 70, status: "safe" }
];

const sourceSelect = document.getElementById("source");
const destinationSelect = document.getElementById("destination");
const analyzeButton = document.getElementById("analyzeButton");
const routeResult = document.getElementById("routeResult");
const routeLines = document.getElementById("routeLines");


// Find the lowest-cost route using Dijkstra's algorithm.
// Risky roads receive an illustrative extra cost.
// Blocked roads are excluded.
function findRoute(start, end) {
    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(locations));

    Object.keys(locations).forEach(node => {
        distances[node] = Infinity;
        previous[node] = null;
    });

    distances[start] = 0;

    while (unvisited.size > 0) {
        let current = null;

        for (const node of unvisited) {
            if (
                current === null ||
                distances[node] < distances[current]
            ) {
                current = node;
            }
        }

        if (current === null || distances[current] === Infinity) {
            break;
        }

        if (current === end) {
            break;
        }

        unvisited.delete(current);

        roads.forEach(road => {
            let neighbour = null;

            if (road.from === current) {
                neighbour = road.to;
            } else if (road.to === current) {
                neighbour = road.from;
            }

            if (!neighbour || !unvisited.has(neighbour)) {
                return;
            }

            if (road.status === "blocked") {
                return;
            }

            const riskPenalty = road.status === "risky" ? 20 : 0;
            const totalCost = distances[current] + road.cost + riskPenalty;

            if (totalCost < distances[neighbour]) {
                distances[neighbour] = totalCost;
                previous[neighbour] = current;
            }
        });
    }

    if (distances[end] === Infinity) {
        return null;
    }

    const path = [];
    let current = end;

    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }

    return {
        path,
        cost: distances[end]
    };
}


// Draw selected route on the demo map
function drawRoute(path) {
    routeLines.innerHTML = "";

    if (!path || path.length < 2) {
        return;
    }

    for (let i = 0; i < path.length - 1; i++) {
        const from = locations[path[i]];
        const to = locations[path[i + 1]];

        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y);

        routeLines.appendChild(line);
    }
}


// Show route analysis
function analyzeRoute() {
    const start = sourceSelect.value;
    const end = destinationSelect.value;

    if (start === end) {
        routeResult.innerHTML = `
            <div class="result-content">
                <h4>Choose two different locations</h4>
                <p>The source and destination cannot be the same.</p>
            </div>
        `;
        routeLines.innerHTML = "";
        return;
    }

    const result = findRoute(start, end);

    if (!result) {
        routeResult.innerHTML = `
            <div class="result-content">
                <h4>No available route found</h4>
                <p>The current sample network does not contain an available path between these locations.</p>
            </div>
        `;
        routeLines.innerHTML = "";
        return;
    }

    drawRoute(result.path);

    const routeNames = result.path.map(node => locations[node].name);

    const routeDetails = [];

    for (let i = 0; i < result.path.length - 1; i++) {
        const from = result.path[i];
        const to = result.path[i + 1];

        const road = roads.find(item =>
            (item.from === from && item.to === to) ||
            (item.from === to && item.to === from)
        );

        if (road) {
            routeDetails.push(
                `${locations[from].name} → ${locations[to].name}: ${road.status}`
            );
        }
    }

    routeResult.innerHTML = `
        <div class="result-content">
            <h4>Recommended sample route found</h4>
            <p><strong>Route:</strong> ${routeNames.join(" → ")}</p>
            <p><strong>Illustrative route cost:</strong> ${result.cost} units</p>
            <p><strong>Road assessment:</strong> ${routeDetails.join(" | ")}</p>
            <p><strong>Algorithm:</strong> Dijkstra's shortest-path algorithm with the demo risk penalty.</p>
        </div>
    `;
}

analyzeButton.addEventListener("click", analyzeRoute);


// Initialise map with the default route
analyzeRoute();
