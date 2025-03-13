document.addEventListener('DOMContentLoaded', async function () {
    const m3uUrl = "https://raw.githubusercontent.com/nero31994/minemu3/refs/heads/main/CIGNAL%20-%202025-03-06T191919.914.m3u";
    const channels = [];
    const categories = new Set(["All Channels"]);
    let currentChannelIndex = 0;

    // Initialize Shaka Player
    const videoElement = document.getElementById("video");
    const player = new shaka.Player(videoElement);

    async function fetchM3U() {
        try {
            const response = await fetch(m3uUrl);
            const text = await response.text();
            parseM3U(text);
        } catch (error) {
            console.error("Error fetching M3U:", error);
            alert("Failed to load playlist.");
        }
    }

    function parseM3U(m3uText) {
        const lines = m3uText.split("\n");
        let currentChannel = null;

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith("#EXTINF")) {
                const match = line.match(/tvg-logo="([^"]+)" group-title="([^"]+)", (.+)/);
                if (match) {
                    const category = match[2].trim();
                    categories.add(category);

                    currentChannel = {
                        name: match[3].trim(),
                        logo: match[1],
                        category: category,
                        manifest: "",
                        drm: null
                    };
                }
            } else if (line.startsWith("http")) {
                if (currentChannel) {
                    currentChannel.manifest = line;
                    channels.push(currentChannel);
                    currentChannel = null;
                }
            }
        });

        updateCategoryDropdown();
        generateChannelList("all");
        if (channels.length > 0) loadChannel(0);
    }

    function updateCategoryDropdown() {
        const categorySelect = document.getElementById("categorySelect");
        categorySelect.innerHTML = `<option value="all">All Channels</option>`;

        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    function generateChannelList(selectedCategory) {
        const listContainer = document.getElementById("channels");
        listContainer.innerHTML = "";

        channels.forEach((channel, index) => {
            if (selectedCategory === "all" || channel.category === selectedCategory) {
                const btn = document.createElement("button");
                btn.className = "channel-btn";
                btn.innerHTML = `<img class="channel-logo" src="${channel.logo}" alt="${channel.name}"> ${channel.name}`;
                btn.onclick = () => loadChannel(index);
                listContainer.appendChild(btn);
            }
        });
    }

    function filterByCategory() {
        const selectedCategory = document.getElementById("categorySelect").value;
        generateChannelList(selectedCategory);
    }

    async function loadChannel(index) {
        if (index < 0 || index >= channels.length) return;

        currentChannelIndex = index;
        const channel = channels[index];
        document.getElementById('logo').src = channel.logo;

        try {
            await player.load(channel.manifest);
            console.log(`${channel.name} loaded successfully!`);
        } catch (error) {
            console.error('Error loading video:', error);
            alert('Failed to load video.');
        }
    }

    fetchM3U();
});
