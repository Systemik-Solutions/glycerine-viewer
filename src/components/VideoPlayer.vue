<template>
    <div :class="{'h-full': fitHeight}">
        <video ref="videoPlayer" class="video-js w-full text-xl" :class="{'h-full': fitHeight}"></video>
    </div>
</template>

<script>
import videojs from 'video.js';
export default {
    name: "VideoPlayer",
    props: {
        // Options for video.js player. See https://videojs.com/guides/options/
        options: {
            type: Object,
            default() {
                return {};
            }
        },
        // Whether to fit the player to the full height of its container
        fitHeight: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            player: null
        }
    },
    mounted() {
        this.player = videojs(this.$refs.videoPlayer, this.options);
    },
    beforeDestroy() {
        if (this.player) {
            this.player.dispose();
        }
    }
}
</script>
