<template>
    <div
        class="gv-anno-set-filter"
        :class="{ 'gv-anno-set-filter--hidden': !visible }"
        :title="$t('ui.annotationSet')"
        @mouseenter="onHoverStart"
        @mouseleave="onHoverEnd"
        @focusin="onFocusStart"
        @focusout="onFocusEnd"
    >
        <i class="pi pi-clone gv-anno-set-filter__icon" aria-hidden="true"></i>
        <Dropdown
            :modelValue="modelValue"
            :options="options"
            option-label="label"
            option-value="value"
            append-to="self"
            class="gv-anno-set-filter__dropdown"
            :aria-label="$t('ui.annotationSet')"
            @update:modelValue="$emit('update:modelValue', $event)"
            @show="onPanelShow"
            @hide="onPanelHide"
        />
    </div>
</template>

<script>
import Dropdown from 'primevue/dropdown';

// Milliseconds of pointer inactivity before the pill fades out. Tune here.
const IDLE_HIDE_DELAY = 3000;

export default {
    name: 'AnnotationSetFilter',
    components: { Dropdown },
    props: {
        // The currently selected annotation set value ('all', a set id, or 'none').
        modelValue: {
            type: [String, Number],
            default: 'all',
        },
        // The option list, same shape as GlycerineViewer's filterSetOptions:
        // [{ label: string, value: string }].
        options: {
            type: Array,
            required: true,
        },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            visible: true,
            isPanelOpen: false,
            isHovering: false,
            isFocused: false,
            hideTimer: null,
            activityTarget: null,
            onActivity: null,
        };
    },
    mounted() {
        // Reveal on any pointer movement over the whole viewer. Fall back to
        // window if the container can't be found.
        this.activityTarget = this.$el.closest('.gv-container') ?? window;
        this.onActivity = () => this.reveal();
        this.activityTarget.addEventListener('mousemove', this.onActivity);
        this.scheduleHide();
    },
    beforeUnmount() {
        if (this.activityTarget && this.onActivity) {
            this.activityTarget.removeEventListener('mousemove', this.onActivity);
        }
        this.clearHideTimer();
    },
    methods: {
        reveal() {
            this.visible = true;
            this.scheduleHide();
        },
        scheduleHide() {
            this.clearHideTimer();
            this.hideTimer = setTimeout(() => {
                // Overrides: never hide while open, hovered, or focused.
                if (!this.isPanelOpen && !this.isHovering && !this.isFocused) {
                    this.visible = false;
                }
            }, IDLE_HIDE_DELAY);
        },
        clearHideTimer() {
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
        },
        onPanelShow() {
            this.isPanelOpen = true;
            this.visible = true;
            this.clearHideTimer();
        },
        onPanelHide() {
            this.isPanelOpen = false;
            this.scheduleHide();
        },
        onHoverStart() {
            this.isHovering = true;
            this.visible = true;
            this.clearHideTimer();
        },
        onHoverEnd() {
            this.isHovering = false;
            this.scheduleHide();
        },
        onFocusStart() {
            this.isFocused = true;
            this.visible = true;
            this.clearHideTimer();
        },
        onFocusEnd() {
            this.isFocused = false;
            this.scheduleHide();
        },
    },
};
</script>

<style scoped>
.gv-anno-set-filter {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background-color: rgba(20, 20, 20, 0.85);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    color: #fff;
    transition: opacity 0.3s ease;
}

.gv-anno-set-filter--hidden {
    opacity: 0;
    pointer-events: none;
}

.gv-anno-set-filter__icon {
    font-size: 1rem;
    color: #fff;
}

.gv-anno-set-filter__dropdown {
    max-width: 16rem;
}

/* Dark theming scoped to this component's dropdown only.
   The panel uses append-to="self", so it renders inside this component's
   DOM and :deep() reaches it without leaking to the Settings dropdowns. */
.gv-anno-set-filter :deep(.p-dropdown) {
    background: transparent;
    border: none;
    box-shadow: none;
}

.gv-anno-set-filter :deep(.p-dropdown:not(.p-disabled):hover) {
    border-color: transparent;
}

.gv-anno-set-filter :deep(.p-dropdown .p-dropdown-label) {
    color: #fff;
    padding: 0.1rem 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.gv-anno-set-filter :deep(.p-dropdown .p-dropdown-trigger) {
    color: #fff;
    width: 1.5rem;
}

.gv-anno-set-filter :deep(.p-dropdown-panel) {
    background: rgba(20, 20, 20, 0.97);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fff;
}

.gv-anno-set-filter :deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item) {
    color: #fff;
}

.gv-anno-set-filter :deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover) {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
}

.gv-anno-set-filter :deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight) {
    background: rgba(255, 255, 255, 0.18);
    color: #fff;
}
</style>
