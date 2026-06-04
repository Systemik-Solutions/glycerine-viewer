<template>
    <div class="gv-anno-set-filter">
        <i class="pi pi-clone gv-anno-set-filter__icon"></i>
        <Dropdown
            :modelValue="modelValue"
            :options="options"
            option-label="label"
            option-value="value"
            append-to="self"
            class="gv-anno-set-filter__dropdown"
            @update:modelValue="$emit('update:modelValue', $event)"
        />
    </div>
</template>

<script>
import Dropdown from 'primevue/dropdown';

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
