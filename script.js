document.addEventListener('DOMContentLoaded', async function () {
    if (!shaka.Player.isBrowserSupported()) {
        alert('Error: Shaka Player is not supported on this browser.');
        return;
    }

    const m3uUrl = "https://raw.githubusercontent.com/nero31994/minemu3/refs/heads/main/CIGNAL%20-%202025-03-06T191919.914.m3u"; 
    const channelsByCategory = {}; // Store channels grouped by category
    let currentCategory = null;
    let currentChannelIndex = 0;

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
                    const category = match[2].trim(); // Extract category name
                    currentChannel = {
                        name: match[3].trim(),
                        logo: match[1],
                        manifest: "",
                        key: {},
                        category: category
                    };

                    if (!channelsByCategory[category]) {
                        channelsByCategory[category] = [];
                    }
                }
            } else if (line.startsWith("#KODIPROP:inputstream.adaptive.license_key=")) {
                const keyMatch = line.split("=")[1].split(":");
                if (currentChannel) {
                    currentChannel.key[keyMatch[0]] = keyMatch[1];
                }
            } else if (line.startsWith("http")) {
                if (currentChannel) {
                    currentChannel.manifest = line;
                    channelsByCategory[currentChannel.category].push(currentChannel);
                    currentChannel = null;
                }
            }
        });

        if (Object.keys(channelsByCategory).length > 0) {
            generateCategoryList();
        } else {
            alert("No channels found in the playlist.");
        }
    }

    function generateCategoryList() {
        const categoryContainer = document.getElementById("categories");
        categoryContainer.innerHTML = "";

        Object.keys(channelsByCategory).forEach((category, index) => {
            const btn = document.createElement("button");
            btn.className = "category-btn";
            btn.textContent = category;
            btn.onclick = () => showCategory(category);
            categoryContainer.appendChild(btn);
        });

        // Automatically show the first category
        showCategory(Object.keys(channelsByCategory)[0]);
    }

    function showCategory(category) {
        currentCategory = category;
        generateChannelList();
    }

    function generateChannelList() {
        const listContainer = document.getElementById("channels");
        listContainer.innerHTML = "";

        const channels = channelsByCategory[currentCategory] || [];
        channels.forEach((channel, index) => {
            const btn = document.createElement("button");
            btn.className = "channel-btn";
            btn.innerHTML = `<img class="channel-logo" src="${channel.logo}" alt="${channel.name}"> ${channel.name}`;
            btn.onclick = () => loadChannel(index);
            listContainer.appendChild(btn);
        });

        updateSelectedChannel();
    }

    const video = document.getElementById('video');
    const logo = document.getElementById('logo');
    const player = new shaka.Player(video);

    player.configure({
        drm: { servers: {}, clearKeys: {} },
        streaming: { bufferingGoal: 10 }
    });

    player.addEventListener('error', (event) => {
        console.error('Shaka Player Error', event.detail);
        alert('Playback Error: ' + event.detail.message);
    });

    async function loadChannel(index) {
        if (!currentCategory || index < 0 || index >= channelsByCategory[currentCategory].length) return;

        currentChannelIndex = index;
        const channel = channelsByCategory[currentCategory][index];

        try {
            logo.src = channel.logo;
            player.configure({ drm: { clearKeys: channel.key } });
            await player.load(channel.manifest);
            console.log(`${channel.name} loaded successfully!`);

            updateSelectedChannel();
        } catch (error) {
            console.error('Error loading video:', error);
            alert('Failed to load video.');
        }
    }

    function updateSelectedChannel() {
        const buttons = document.querySelectorAll(".channel-btn");
        buttons.forEach((btn, index) => {
            btn.classList.toggle("selected", index === currentChannelIndex);
        });
    }

    fetchM3U();
});
