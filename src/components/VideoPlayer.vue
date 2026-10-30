<template>
    <div :class="{'h-full': fitHeight}">
        <video ref="videoPlayer" class="video-js w-full text-xl" :class="{'h-full': fitHeight}"></video>
    </div>
</template>

<script>
import videojs from 'video.js';
import { markRaw } from 'vue';
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
        this.player = markRaw(videojs(this.$refs.videoPlayer, this.options));
    },
    beforeUnmount() {
        if (this.player && !this.player.isDisposed()) {
            this.player.dispose();
        }
        this.player = null;
    }
}
</script>
