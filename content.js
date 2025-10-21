(function () {
	function getText(el) {
		return (el && (el.textContent || el.innerText || "").trim()) || "";
	}

	function collectSeoData() {
		const titleEl = document.querySelector("title");
		const metaDescEl = document.querySelector('meta[name="description"]');
		const h1Els = Array.from(document.querySelectorAll("h1"));
		const h2Els = Array.from(document.querySelectorAll("h2"));

		const title = titleEl ? getText(titleEl) : "";
		const description = metaDescEl ? (metaDescEl.getAttribute("content") || "").trim() : "";
		const h1Texts = h1Els.map((n) => getText(n)).filter(Boolean);
		const h2Texts = h2Els.map((n) => getText(n)).filter(Boolean);

		return {
			title,
			description,
			h1Texts,
			h2Texts,
			url: location.href
		};
	}

	async function checkRobotsTxt() {
		try {
			const robotsUrl = new URL("/robots.txt", location.origin).toString();
			const res = await fetch(robotsUrl, { method: "GET", cache: "no-store" });
			if (!res.ok) return { exists: false, url: robotsUrl };
			const text = await res.text();
			return { exists: !!text, url: robotsUrl, preview: text.slice(0, 1000) };
		} catch (e) {
			return { exists: false, error: String(e) };
		}
	}

	async function getSeoPayload() {
		const basic = collectSeoData();
		const robots = await checkRobotsTxt();
		return { ...basic, robots };
	}

	// Cache on page load to speed up responses
	(async () => {
		try {
			const data = await getSeoPayload();
			window.__SEO_BASIC_DATA__ = data;
		} catch (_) {}
	})();

	// Respond to requests from popup
	try {
		chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
			if (!request || request.type !== "GET_SEO_DATA") return;
			(async () => {
				try {
					const data = window.__SEO_BASIC_DATA__ || (await getSeoPayload());
					sendResponse({ ok: true, data });
				} catch (e) {
					sendResponse({ ok: false, error: String(e) });
				}
			})();
			return true; // keep channel open for async
		});
	} catch (_) {}
})();


