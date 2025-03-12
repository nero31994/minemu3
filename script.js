document.addEventListener('DOMContentLoaded', async function () {
    if (!shaka.Player.isBrowserSupported()) {
        alert('Error: Shaka Player is not supported on this browser.');
        return;
    }

    const m3uUrl = "https://raw.githubusercontent.com/nero31994/minemu3/refs/heads/main/CIGNAL%20-%202025-03-06T191919.914.m3u"; 
    const channels = [];
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
                    currentChannel = {
                        name: match[3].trim(),
                        logo: match[1],
                        manifest: "",
                        key: {}
                    };
                }
            } else if (line.startsWith("#KODIPROP:inputstream.adaptive.license_key=")) {
                const keyMatch = line.split("=")[1].split(":");
                if (currentChannel) {
                    currentChannel.key[keyMatch[0]] = keyMatch[1];
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
            loadChannel(0, true);
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

    async function loadChannel(index, autoplay = false) {
        if (index < 0 || index >= channels.length) return;

        currentChannelIndex = index;
        const channel = channels[index];

        try {
            logo.src = channel.logo;
            player.configure({ drm: { clearKeys: channel.key } });
            await player.load(channel.manifest);
            console.log(`${channel.name} loaded successfully!`);

            updateSelectedChannel();
            enterFullscreenAndPlay(); // Auto fullscreen and then autoplay

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

    // Auto Fullscreen + Autoplay Function
    function enterFullscreenAndPlay() {
        function playAfterFullscreen() {
            video.play();
            document.removeEventListener("fullscreenchange", playAfterFullscreen);
            document.removeEventListener("webkitfullscreenchange", playAfterFullscreen);
            document.removeEventListener("mozfullscreenchange", playAfterFullscreen);
            document.removeEventListener("MSFullscreenChange", playAfterFullscreen);
        }

        if (video.requestFullscreen) {
            document.addEventListener("fullscreenchange", playAfterFullscreen);
            video.requestFullscreen();
        } else if (video.mozRequestFullScreen) { // Firefox
            document.addEventListener("mozfullscreenchange", playAfterFullscreen);
            video.mozRequestFullScreen();
        } else if (video.webkitRequestFullscreen) { // Chrome, Safari, Edge
            document.addEventListener("webkitfullscreenchange", playAfterFullscreen);
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) { // IE/Edge
            document.addEventListener("MSFullscreenChange", playAfterFullscreen);
            video.msRequestFullscreen();
        } else {
            video.play(); // If fullscreen is not supported, just play the video
        }
    }

    // Search Bar
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase();
        const buttons = document.querySelectorAll(".channel-btn");

        buttons.forEach(btn => {
            const text = btn.textContent.toLowerCase();
            btn.style.display = text.includes(searchTerm) ? "flex" : "none";
        });
    });

    // Remote & Keyboard Navigation
    document.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "ArrowUp":
                loadChannel(currentChannelIndex - 1);
                break;
            case "ArrowDown":
                loadChannel(currentChannelIndex + 1);
                break;
            case "Enter":
                video.play();
                break;
            case " ":
                video.paused ? video.play() : video.pause();
                break;
        }
    });

    fetchM3U();
});
