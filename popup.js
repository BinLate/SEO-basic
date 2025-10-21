(function () {
	const statusEl = document.getElementById("status");
	const titleEl = document.getElementById("title");
	const descEl = document.getElementById("description");
	const h1El = document.getElementById("h1");
	const h2El = document.getElementById("h2");
	const robotsEl = document.getElementById("robots");

	function renderList(items) {
		if (!items || items.length === 0) return '<span class="warn">Chưa có</span>';
		return '<ul>' + items.map((t) => `<li>${escapeHtml(t)}</li>`).join("") + '</ul>';
	}

	function escapeHtml(str) {
		return String(str)
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	function summarize(arr, label) {
		if (!arr || arr.length === 0) return `<span class="warn">Chưa có ${label}</span>`;
		if (arr.length > 1) {
			return `<div class="warn">Có ${arr.length} ${label}. Nội dung:</div>${renderList(arr)}`;
		}
		return `<div class="ok">1 ${label}:</div>${renderList(arr)}`;
	}

	function setHtml(el, html) {
		el.innerHTML = html;
	}

	function getActiveTab() {
		return new Promise((resolve) => {
			try {
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0]));
			} catch (e) {
				resolve(null);
			}
		});
	}

	function requestDataFromPage(tabId) {
		return new Promise((resolve, reject) => {
			try {
				chrome.tabs.sendMessage(tabId, { type: "GET_SEO_DATA" }, (response) => {
					if (chrome.runtime.lastError) {
						return reject(chrome.runtime.lastError.message);
					}
					if (!response || !response.ok) {
						return reject((response && response.error) || "No response");
					}
					resolve(response.data);
				});
			} catch (e) {
				reject(String(e));
			}
		});
	}

	(async function init() {
		const tab = await getActiveTab();
		if (!tab) {
			statusEl.textContent = "Không thể lấy tab hiện tại.";
			return;
		}
		try {
			const data = await requestDataFromPage(tab.id);
			statusEl.textContent = data && data.url ? data.url : "";

			const title = data.title && data.title.trim() ? data.title.trim() : "";
			const desc = data.description && data.description.trim() ? data.description.trim() : "";

			setHtml(titleEl, title ? `<div class="ok">${escapeHtml(title)}</div>` : '<span class="warn">Chưa có tiêu đề</span>');
			setHtml(descEl, desc ? `<div class="ok">${escapeHtml(desc)}</div>` : '<span class="warn">Chưa có description</span>');

			setHtml(h1El, summarize(data.h1Texts, "thẻ H1"));
			setHtml(h2El, data.h2Texts && data.h2Texts.length ? renderList(data.h2Texts) : '<span class="warn">Chưa có thẻ H2</span>');

			if (data.robots && data.robots.exists) {
				const link = `<a href="${data.robots.url}" target="_blank" rel="noreferrer">${data.robots.url}</a>`;
				robotsEl.innerHTML = `<div class="ok">Có robots.txt: ${link}</div>`;
			} else {
				robotsEl.innerHTML = '<span class="warn">Chưa có robots.txt</span>';
			}
		} catch (e) {
			statusEl.textContent = "Lỗi lấy dữ liệu: " + String(e);
		}
	})();
})();


