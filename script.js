document.addEventListener('DOMContentLoaded', async function () {
    if (!shaka.Player.isBrowserSupported()) {
        alert('Error: Shaka Player is not supported on this browser.');
        return;
    }

    const m3uUrl = "https://raw.githubusercontent.com/nero31994/minemu3/refs/heads/main/CIGNAL%20-%202025-03-06T191919.914.m3u"; // Change this to your M3U URL
    const channels = [];

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
                    currentChannel = {
                        name: match[3].trim(),
                        logo: match[1],
                        manifest: "",
                        key: {}
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

        if (channels.length > 0) {
            generateChannelList();
            loadChannel(0);
        } else {
            alert("No channels found in the playlist.");
        }
    }

    function generateChannelList() {
        const listContainer = document.getElementById("channels");
        listContainer.innerHTML = "";

        channels.forEach((channel, index) => {
            const btn = document.createElement("button");
            btn.className = "channel-btn";
            btn.innerHTML = `<img class="channel-logo" src="${channel.logo}" alt="${channel.name}"> ${channel.name}`;
            btn.onclick = () => loadChannel(index);
            listContainer.appendChild(btn);
        });
    }

    const video = document.getElementById('video');
    const logo = document.getElementById('logo');
    const player = new shaka.Player(video);

    player.addEventListener('error', (event) => {
        console.error('Shaka Player Error', event.detail);
        alert('Playback Error: ' + event.detail.message);
    });

    async function loadChannel(index) {
        const channel = channels[index];

        try {
            logo.src = channel.logo;

            player.configure({
                drm: {
                    clearKeys: channel.key
                }
            });

            await player.load(channel.manifest);
            console.log(`${channel.name} loaded successfully!`);
        } catch (error) {
            console.error('Error loading video:', error);
            alert('Failed to load video.');
        }
    }

    // Search Filter for Channels
    document.getElementById("searchInput").addEventListener("input", function () {
        const searchValue = this.value.toLowerCase();
        const buttons = document.querySelectorAll(".channel-btn");

        buttons.forEach(button => {
            const name = button.innerText.toLowerCase();
            button.style.display = name.includes(searchValue) ? "flex" : "none";
        });
    });

    fetchM3U();
});
