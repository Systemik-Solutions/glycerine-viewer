import "video.js/dist/video-js.min.css";
import "@/assets/styles.css";
import GlycerineViewerPlugin from "@/plugins/GlycerineViewerPlugin.js";
import GlycerineViewer from "@/components/GlycerineViewer.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import TableViewer from "@/components/TableViewer.vue";
import TermTagGroup from "@/components/TermTagGroup.vue";
import ResourceInfoCard from "@/components/ResourceInfoCard.vue";
import AgentCard from "@/components/AgentCard.vue";
import VideoPlayer from "@/components/VideoPlayer.vue";
import AudioViewer from "@/components/AudioViewer.vue";
import VideoViewer from "@/components/VideoViewer.vue";
import AnnotationCropper from "@/libraries/annotation-cropper.js";
import Helper from "@/libraries/helper.js";
import ImageCropper from "@/libraries/image-cropper.js";
import ImageLoader from "@/libraries/image-loader.js";
import Language from "@/libraries/languages.js";

// Import IIIF libraries from the dependency manager.
import { ManifestLoader, ResourceParser, ImageParser, AudioParser, VideoParser, ManifestParser, SpecificResourceParser, AgentParser, CollectionParser, IiifHelper } from "@/libraries/iiif/dependency-manager.js";

export {
    GlycerineViewerPlugin,
    GlycerineViewer,
    ImageViewer,
    TableViewer,
    TermTagGroup,
    ResourceInfoCard,
    AgentCard,
    VideoPlayer,
    AudioViewer,
    VideoViewer,
    AnnotationCropper,
    Helper,
    ImageCropper,
    ImageLoader,
    Language,
    ManifestLoader,
    ResourceParser,
    ManifestParser,
    ImageParser,
    AudioParser,
    VideoParser,
    SpecificResourceParser,
    AgentParser,
    CollectionParser,
    IiifHelper,
}
