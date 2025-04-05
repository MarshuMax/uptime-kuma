<template>
    <div>
        <div :style="depthMargin">
            <!-- Checkbox -->
            <div v-if="isSelectMode" class="select-input-wrapper">
                <input
                    class="form-check-input select-input"
                    type="checkbox"
                    :aria-label="$t('Check/Uncheck')"
                    :checked="isSelected(monitor.id)"
                    @click.stop="toggleSelection"
                />
            </div>

            <router-link :to="monitorURL(monitor.id)" class="item" :class="{ 'disabled': ! monitor.active }">
                <div class="row">
                    <div class="col-9 col-md-8 small-padding" :class="{ 'monitor-item': $root.userHeartbeatBar == 'bottom' || $root.userHeartbeatBar == 'none' }">
                        <div class="info">
                            <Uptime :monitor="monitor" type="24" :pill="true" />
                            <span v-if="hasChildren" class="collapse-padding" @click.prevent="changeCollapsed">
                                <font-awesome-icon icon="chevron-down" class="animated" :class="{ collapsed: isCollapsed}" />
                            </span>
                            {{ monitor.name }}
                        </div>
                        <div v-if="monitor.tags.length > 0" class="tags">
                            <Tag v-for="tag in monitor.tags" :key="tag" :item="tag" :size="'sm'" />
                        </div>
                    </div>
                    <div v-show="$root.userHeartbeatBar == 'normal'" :key="$root.userHeartbeatBar" class="col-3 col-md-4">
                        <HeartbeatBar ref="heartbeatBar" size="small" :monitor-id="monitor.id" />
                    </div>
                </div>

                <div v-if="$root.userHeartbeatBar == 'bottom'" class="row">
                    <div class="col-12 bottom-style">
                        <HeartbeatBar ref="heartbeatBar" size="small" :monitor-id="monitor.id" />
                    </div>
                </div>
            </router-link>

            <!-- 添加编辑和删除按钮 -->
            <div v-if="!isSelectMode" class="action-buttons">
                <router-link v-if="canEdit()" :to="'/edit/' + monitor.id" class="btn btn-sm btn-outline-secondary me-1">
                    <font-awesome-icon icon="edit" />
                </router-link>
                <button v-if="canDelete()" class="btn btn-sm btn-outline-danger" @click="confirmDelete(monitor)">
                    <font-awesome-icon icon="trash" />
                </button>
            </div>
        </div>

        <transition name="slide-fade-up">
            <div v-if="!isCollapsed" class="childs">
                <MonitorListItem
                    v-for="(item, index) in sortedChildMonitorList"
                    :key="index"
                    :monitor="item"
                    :isSelectMode="isSelectMode"
                    :isSelected="isSelected"
                    :select="select"
                    :deselect="deselect"
                    :depth="depth + 1"
                    :filter-func="filterFunc"
                    :sort-func="sortFunc"
                />
            </div>
        </transition>

        <!-- 确认删除对话框 -->
        <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="deleteConfirmModalLabel">{{ $t("Delete Monitor") }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        {{ $t("deleteMonitorMsg") }}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t("Cancel") }}</button>
                        <button type="button" class="btn btn-danger" @click="deleteMonitor">{{ $t("Delete") }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import HeartbeatBar from "../components/HeartbeatBar.vue";
import Tag from "../components/Tag.vue";
import Uptime from "../components/Uptime.vue";
import { getMonitorRelativeURL } from "../util.ts";
import { Modal } from "bootstrap";

export default {
    name: "MonitorListItem",
    components: {
        Uptime,
        HeartbeatBar,
        Tag,
    },
    props: {
        /** Monitor this represents */
        monitor: {
            type: Object,
            default: null,
        },
        /** If the user is in select mode */
        isSelectMode: {
            type: Boolean,
            default: false,
        },
        /** How many ancestors are above this monitor */
        depth: {
            type: Number,
            default: 0,
        },
        /** Callback to determine if monitor is selected */
        isSelected: {
            type: Function,
            default: () => {}
        },
        /** Callback fired when monitor is selected */
        select: {
            type: Function,
            default: () => {}
        },
        /** Callback fired when monitor is deselected */
        deselect: {
            type: Function,
            default: () => {}
        },
        /** Function to filter child monitors */
        filterFunc: {
            type: Function,
            default: () => {}
        },
        /** Function to sort child monitors */
        sortFunc: {
            type: Function,
            default: () => {},
        }
    },
    data() {
        return {
            isCollapsed: true,
            monitorToDelete: null,
            deleteModal: null,
        };
    },
    computed: {
        sortedChildMonitorList() {
            let result = Object.values(this.$root.monitorList);

            // Get children
            result = result.filter(childMonitor => childMonitor.parent === this.monitor.id);

            // Run filter on children
            result = result.filter(this.filterFunc);

            result.sort(this.sortFunc);

            return result;
        },
        hasChildren() {
            return this.sortedChildMonitorList.length > 0;
        },
        depthMargin() {
            return {
                marginLeft: `${31 * this.depth}px`,
            };
        },
    },
    watch: {
        isSelectMode() {
            // TODO: Resize the heartbeat bar, but too slow
            // this.$refs.heartbeatBar.resize();
        }
    },
    mounted() {
        this.deleteModal = new Modal(document.getElementById('deleteConfirmModal'));
    },
    beforeMount() {

        // Always unfold if monitor is accessed directly
        if (this.monitor.childrenIDs.includes(parseInt(this.$route.params.id))) {
            this.isCollapsed = false;
            return;
        }

        // Set collapsed value based on local storage
        let storage = window.localStorage.getItem("monitorCollapsed");
        if (storage === null) {
            return;
        }

        let storageObject = JSON.parse(storage);
        if (storageObject[`monitor_${this.monitor.id}`] == null) {
            return;
        }

        this.isCollapsed = storageObject[`monitor_${this.monitor.id}`];
    },
    methods: {
        /**
         * 检查当前用户是否能编辑监控项
         * @returns {boolean} 是否可以编辑
         */
        canEdit() {
            // 管理员可以编辑所有监控项
            if (this.$root.userRole === "admin") {
                return true;
            }
            
            // 非管理员只能编辑自己创建的监控项
            return this.monitor.user_id === this.$root.userID;
        },

        /**
         * 检查当前用户是否能删除监控项
         * @returns {boolean} 是否可以删除
         */
        canDelete() {
            // 管理员可以删除所有监控项
            if (this.$root.userRole === "admin") {
                return true;
            }
            
            // 非管理员只能删除自己创建的监控项
            return this.monitor.user_id === this.$root.userID;
        },

        /**
         * 确认删除监控项
         * @param {Object} monitor 要删除的监控项
         */
        confirmDelete(monitor) {
            this.monitorToDelete = monitor;
            this.deleteModal.show();
        },

        /**
         * 删除监控项
         */
        deleteMonitor() {
            if (this.monitorToDelete) {
                this.$root.getSocket().emit("deleteMonitor", this.monitorToDelete.id, (res) => {
                    if (res.ok) {
                        this.$root.toastSuccess(this.$t("Deleted Successfully"));
                    } else {
                        this.$root.toastError(res.msg);
                    }
                });
                this.deleteModal.hide();
                this.monitorToDelete = null;
            }
        },

        /**
         * Changes the collapsed value of the current monitor and saves
         * it to local storage
         * @returns {void}
         */
        changeCollapsed() {
            this.isCollapsed = !this.isCollapsed;

            // Save collapsed value into local storage
            let storage = window.localStorage.getItem("monitorCollapsed");
            let storageObject = {};
            if (storage !== null) {
                storageObject = JSON.parse(storage);
            }
            storageObject[`monitor_${this.monitor.id}`] = this.isCollapsed;

            window.localStorage.setItem("monitorCollapsed", JSON.stringify(storageObject));
        },
        /**
         * Get URL of monitor
         * @param {number} id ID of monitor
         * @returns {string} Relative URL of monitor
         */
        monitorURL(id) {
            return getMonitorRelativeURL(id);
        },
        /**
         * Toggle selection of monitor
         * @returns {void}
         */
        toggleSelection() {
            if (this.isSelected(this.monitor.id)) {
                this.deselect(this.monitor.id);
            } else {
                this.select(this.monitor.id);
            }
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.small-padding {
    padding-left: 5px !important;
    padding-right: 5px !important;
}

.collapse-padding {
    padding-left: 8px !important;
    padding-right: 2px !important;
}

// .monitor-item {
//     width: 100%;
// }

.tags {
    margin-top: 4px;
    padding-left: 67px;
    display: flex;
    flex-wrap: wrap;
    gap: 0;
}

.collapsed {
    transform: rotate(-90deg);
}

.animated {
    transition: all 0.2s $easing-in;
}

.select-input-wrapper {
    float: left;
    margin-top: 15px;
    margin-left: 3px;
    margin-right: 10px;
    padding-left: 4px;
    position: relative;
    z-index: 15;
}

.item {
    display: flex;
    flex-direction: column;
    padding: 7px 14px 7px 0;
    flex-grow: 1;
    text-decoration: none;
    color: var(--color-font);

    &.disabled {
        opacity: 0.6;
    }
}

.row {
    width: 100%;
}

.info {
    display: flex;
    align-items: center;
}

.monitor-item {
    display: flex;
    flex-direction: column;
}

.bottom-style {
    padding-left: 0;
    padding-right: 0;
}

.action-buttons {
    display: flex;
    align-items: center;
    margin-right: 10px;
}
</style>
