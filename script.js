<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IPTV Player</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.6/shaka-player.compiled.min.js"></script>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 110vh;
            margin: 0;
            background-color: #000;
            color: white;
            font-family: Arial, sans-serif;
        }
        #video-container {
            position: relative;
            max-width: 800px;
            width: 70%;
        }
        video {
            width: 100%;
            height: auto;
            background: black;
        }
        #logo {
            position: absolute;
            top: 10px;
            left: 10px;
            width: 50px;
            background: rgba(0, 0, 0, 0.5);
            padding: 5px;
            border-radius: 5px;
        }
        #channel-list {
            margin-top: 20px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
        }
        .channel-btn {
            background: #222;
            color: white;
            padding: 10px;
            border: none;
            cursor: pointer;
            border-radius: 5px;
            transition: 0.3s;
        }
        .channel-btn:hover {
            background: #444;
        }
    </style>
</head>
<body>

    <div id="video-container">
        <img id="logo" src="" alt="Channel Logo">
        <video id="video" autoplay controls></video>
    </div>

    <div id="channel-list"></div>

    <script>
        document.addEventListener('DOMContentLoaded', async function () {
            if (!shaka.Player.isBrowserSupported()) {
                alert('Error: Shaka Player is not supported on this browser.');
                return;
            }

            const m3uUrl = "https://example.com/playlist.m3u"; // Change to your M3U file URL
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
                    loadChannel(0);
                } else {
                    alert("No channels found in the playlist.");
                }
            }

            function generateChannelList() {
                const listContainer = document.getElementById("channel-list");
                listContainer.innerHTML = "";

                channels.forEach((channel, index) => {
                    const btn = document.createElement("button");
                    btn.className = "channel-btn";
                    btn.textContent = channel.name;
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

            fetchM3U();
        });
    </script>

</body>
</html>
