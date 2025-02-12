<template>
    <div class="w-full h-full bg-gray-900 flex flex-column justify-content-end" style="overflow-y:auto">
        <div class="p-3 flex-grow-1">
            <VideoPlayer :fit-height="true" :options="{ controls: true, responsive: true, sources: [{ src: source }] }" />
        </div>
    </div>
</template>

<script>
import VideoPlayer from "@/components/VideoPlayer.vue";
export default {
    name: "VideoViewer",
    components: {
        VideoPlayer
    },
    props: {
        source: {
            type: String,
            required: true,
        }
    }
}
</script>
