<template>
    <!-- Group List -->
    <Draggable
        v-model="$root.publicGroupList"
        :disabled="!editMode"
        item-key="id"
        :animation="100"
    >
        <template #item="group">
            <div class="mb-5" data-testid="group">
                <!-- Group Title -->
                <h2 class="group-title">
                    <font-awesome-icon v-if="editMode && showGroupDrag" icon="arrows-alt-v" class="action drag me-3" />
                    <font-awesome-icon v-if="editMode" icon="times" class="action remove me-3" @click="removeGroup(group.index)" />
                    <Editable v-model="group.element.name" :contenteditable="editMode" tag="span" data-testid="group-name" />
                </h2>

                <!-- Sort Buttons - Moved below the title -->
                <div v-if="!editMode && group.element.monitorList.length > 0" class="sort-controls-container mb-3">
                    <div class="sort-controls">
                        <span class="sort-label me-2">{{ $t("排序方式") }}:</span>
                        <button
                            class="btn btn-sm sort-button"
                            :class="{'active': group.element.sortKey === 'status'}"
                            @click="setSort(group.element, 'status')"
                        >
                            {{ $t("状态") }}
                            <font-awesome-icon v-if="group.element.sortKey === 'status'" :icon="group.element.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" />
                        </button>
                        <button
                            class="btn btn-sm sort-button"
                            :class="{'active': group.element.sortKey === 'name'}"
                            @click="setSort(group.element, 'name')"
                        >
                            {{ $t("名称") }}
                            <font-awesome-icon v-if="group.element.sortKey === 'name'" :icon="group.element.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" />
                        </button>
                        <button
                            class="btn btn-sm sort-button"
                            :class="{'active': group.element.sortKey === 'uptime'}"
                            @click="setSort(group.element, 'uptime')"
                        >
                            {{ $t("正常运行时间") }}
                            <font-awesome-icon v-if="group.element.sortKey === 'uptime'" :icon="group.element.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" />
                        </button>
                        <button
                            v-if="showCertificateExpiry"
                            class="btn btn-sm sort-button"
                            :class="{'active': group.element.sortKey === 'cert'}"
                            @click="setSort(group.element, 'cert')"
                        >
                            {{ $t("证书过期时间") }}
                            <font-awesome-icon v-if="group.element.sortKey === 'cert'" :icon="group.element.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" />
                        </button>
                    </div>
                </div>

                <div class="shadow-box monitor-list mt-4 position-relative">
                    <div v-if="group.element.monitorList.length === 0" class="text-center no-monitor-msg">
                        {{ $t("No Monitors") }}
                    </div>

                    <!-- Monitor List -->
                    <!-- animation is not working, no idea why -->
                    <Draggable
                        v-model="group.element.monitorList"
                        class="monitor-list"
                        group="same-group"
                        :disabled="!editMode"
                        :animation="100"
                        item-key="id"
                    >
                        <template #item="{ element: monitor, index: monitorIndex }">
                            <div class="item" data-testid="monitor">
                                <div class="row">
                                    <div class="col-9 col-md-8 small-padding">
                                        <div class="info">
                                            <font-awesome-icon v-if="editMode" icon="arrows-alt-v" class="action drag me-3" />
                                            <font-awesome-icon v-if="editMode" icon="times" class="action remove me-3" @click="removeMonitor(group.index, monitorIndex)" />

                                            <Uptime :monitor="monitor" type="24" :pill="true" />
                                            <a
                                                v-if="showLink(monitor)"
                                                :href="monitor.url"
                                                class="item-name"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                data-testid="monitor-name"
                                            >
                                                {{ monitor.name }}
                                            </a>
                                            <p v-else class="item-name" data-testid="monitor-name"> {{ monitor.name }} </p>

                                            <span
                                                title="Setting"
                                            >
                                                <font-awesome-icon
                                                    v-if="editMode"
                                                    :class="{'link-active': true, 'btn-link': true}"
                                                    icon="cog" class="action me-3"
                                                    @click="$refs.monitorSettingDialog.show(group.element, monitor)"
                                                />
                                            </span>
                                        </div>
                                        <div class="extra-info">
                                            <div v-if="showCertificateExpiry && monitor.certExpiryDaysRemaining">
                                                <Tag :item="{name: $t('Cert Exp.'), value: formattedCertExpiryMessage(monitor), color: certExpiryColor(monitor)}" :size="'sm'" />
                                            </div>
                                            <div v-if="showTags">
                                                <Tag v-for="tag in monitor.tags" :key="tag" :item="tag" :size="'sm'" data-testid="monitor-tag" />
                                            </div>
                                        </div>
                                    </div>
                                    <div :key="$root.userHeartbeatBar" class="col-3 col-md-4">
                                        <HeartbeatBar size="mid" :monitor-id="monitor.id" />
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Draggable>
                </div>
            </div>
        </template>
    </Draggable>
    <MonitorSettingDialog ref="monitorSettingDialog" />
</template>

<script>
import MonitorSettingDialog from "./MonitorSettingDialog.vue";
import Draggable from "vuedraggable";
import HeartbeatBar from "./HeartbeatBar.vue";
import Uptime from "./Uptime.vue";
import Tag from "./Tag.vue";

export default {
    components: {
        MonitorSettingDialog,
        Draggable,
        HeartbeatBar,
        Uptime,
        Tag,
    },
    props: {
        /** Are we in edit mode? */
        editMode: {
            type: Boolean,
            required: true,
        },
        /** Should tags be shown? */
        showTags: {
            type: Boolean,
        },
        /** Should expiry be shown? */
        showCertificateExpiry: {
            type: Boolean,
        },
        /** Status page slug */
        slug: {
            type: String,
            default: 'default'
        }
    },
    data() {
        return {
            // Initialize sortKey and sortDirection for each group if they don't exist
            // This is handled in the created hook or when groups are loaded
        };
    },
    computed: {
        showGroupDrag() {
            return (this.$root.publicGroupList.length >= 2);
        },
    },
    watch: {
        // Watch for changes in heartbeatList to re-apply sort
        '$root.heartbeatList': {
            handler() {
                this.$root.publicGroupList.forEach(group => {
                    this.applySort(group);
                });
            },
            deep: true,
        },
        // Watch for changes in uptimeList to re-apply sort
        '$root.uptimeList': {
             handler() {
                this.$root.publicGroupList.forEach(group => {
                    this.applySort(group);
                });
            },
            deep: true,
        },
    },
    created() {
        // 从 localStorage 获取排序设置的方法
        const getSavedSortSettings = (group) => {
            try {
                const groupId = group.id || group.name || '默认分组';
                const storageKey = `uptime-kuma-sort-${this.slug}-${groupId}`;
                
                const savedSettings = localStorage.getItem(storageKey);
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    return {
                        key: settings.key,
                        direction: settings.direction
                    };
                }
            } catch (error) {
                console.error('无法读取排序设置', error);
            }
            return null;
        };

        // Initialize sort state and apply initial sort for existing groups
        this.$root.publicGroupList.forEach(group => {
            // 尝试从 localStorage 中读取保存的排序设置
            const savedSettings = getSavedSortSettings(group);
            
            if (savedSettings) {
                // 如果找到保存的设置，应用它
                group.sortKey = savedSettings.key;
                group.sortDirection = savedSettings.direction;
            } else {
                // 否则使用默认设置
                if (group.sortKey === undefined) {
                    group.sortKey = 'status';
                }
                if (group.sortDirection === undefined) {
                    group.sortDirection = 'desc';
                }
            }
            
            // Apply initial sort when the component is created
            this.applySort(group);
        });

        // Watch for new groups being added and initialize their sort state
        this.$root.$watch('publicGroupList', (newGroups) => {
            newGroups.forEach(group => {
                if (group.sortKey === undefined) {
                    // 尝试从 localStorage 中读取排序设置
                    const savedSettings = getSavedSortSettings(group);
                    
                    if (savedSettings) {
                        // 如果找到保存的设置，应用它
                        group.sortKey = savedSettings.key;
                        group.sortDirection = savedSettings.direction;
                    } else {
                        // 否则使用默认设置
                        group.sortKey = 'status';
                        group.sortDirection = 'desc';
                    }
                    
                    // Apply sort to newly added group
                    this.applySort(group);
                }
            });
        }, { deep: true });
    },
    methods: {
        /**
         * Set sort key and direction for a group, then apply the sort
         * @param {object} group The group object
         * @param {string} key The sort key ('status', 'name', 'uptime', 'cert')
         */
        setSort(group, key) {
            if (group.sortKey === key) {
                group.sortDirection = group.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                group.sortKey = key;
                group.sortDirection = (key === 'status') ? 'desc' : 'asc';
            }
            
            // 保存排序设置到 localStorage
            try {
                // 获取分组的唯一标识，如果没有 id 则使用名称
                const groupId = group.id || group.name || '默认分组';
                const storageKey = `uptime-kuma-sort-${this.slug}-${groupId}`;
                
                // 保存排序设置
                const sortSettings = {
                    key: group.sortKey,
                    direction: group.sortDirection
                };
                localStorage.setItem(storageKey, JSON.stringify(sortSettings));
            } catch (error) {
                console.error('无法保存排序设置', error);
            }
            
            this.applySort(group); // Apply sort immediately after changing settings
        },

        /**
         * Apply sorting logic directly to the group's monitorList (in-place)
         * @param {object} group The group object containing monitorList
         */
        applySort(group) {
            if (!group || !group.monitorList) {
                return;
            }

            const sortKey = group.sortKey || 'status';
            const sortDirection = group.sortDirection || 'desc';

            group.monitorList.sort((a, b) => {
                 let comparison = 0;
                 let valueA, valueB;

                if (sortKey === 'status') {
                    const getStatusPriority = (monitor) => {
                         // Ensure heartbeatList is available
                        const hbList = this.$root.heartbeatList || {};
                        const hbArr = hbList[monitor.id];
                        if (hbArr && hbArr.length > 0) {
                            const lastStatus = hbArr.at(-1).status;
                            if (lastStatus === 0) return 0; // Down
                            if (lastStatus === 1) return 1; // Up
                            if (lastStatus === 2) return 2; // Pending
                            if (lastStatus === 3) return 3; // Maintenance
                        }
                        return 4; // Unknown/No data - sort last
                    };
                    valueA = getStatusPriority(a);
                    valueB = getStatusPriority(b);
                } else if (sortKey === 'name') {
                    valueA = a.name ? a.name.toLowerCase() : '';
                    valueB = b.name ? b.name.toLowerCase() : '';
                } else if (sortKey === 'uptime') {
                    const uptimeList = this.$root.uptimeList || {};
                    const uptimeA = parseFloat(uptimeList[`${a.id}_24`]) || 0;
                    const uptimeB = parseFloat(uptimeList[`${b.id}_24`]) || 0;
                    valueA = uptimeA;
                    valueB = uptimeB;
                } else if (sortKey === 'cert') {
                    // 按证书过期时间排序
                    // 有效证书的监控器值为剩余天数，无效证书或没有证书的值为 -1
                    valueA = a.validCert && a.certExpiryDaysRemaining ? a.certExpiryDaysRemaining : -1;
                    valueB = b.validCert && b.certExpiryDaysRemaining ? b.certExpiryDaysRemaining : -1;
                }

                if (valueA < valueB) {
                    comparison = -1;
                } else if (valueA > valueB) {
                    comparison = 1;
                }

                // 只在按状态排序时，才特殊处理宕机服务器的位置
                if (sortKey === 'status') {
                    return sortDirection === 'desc' ? (comparison * -1) : comparison;
                } else {
                    // 使用纯粹的排序结果，不特殊处理宕机服务器
                    return sortDirection === 'asc' ? comparison : (comparison * -1);
                }
            });
        },
        /**
         * Remove the specified group
         * @param {number} index Index of group to remove
         * @returns {void}
         */
        removeGroup(index) {
            this.$root.publicGroupList.splice(index, 1);
        },

        /**
         * Remove a monitor from a group
         * @param {number} groupIndex Index of group to remove monitor
         * from
         * @param {number} index Index of monitor to remove
         * @returns {void}
         */
        removeMonitor(groupIndex, index) {
            this.$root.publicGroupList[groupIndex].monitorList.splice(index, 1);
        },

        /**
         * Should a link to the monitor be shown?
         * Attempts to guess if a link should be shown based upon if
         * sendUrl is set and if the URL is default or not.
         * @param {object} monitor Monitor to check
         * @param {boolean} ignoreSendUrl Should the presence of the sendUrl
         * property be ignored. This will only work in edit mode.
         * @returns {boolean} Should the link be shown
         */
        showLink(monitor, ignoreSendUrl = false) {
            // We must check if there are any elements in monitorList to
            // prevent undefined errors if it hasn't been loaded yet
            if (this.$parent.editMode && ignoreSendUrl && Object.keys(this.$root.monitorList).length) {
                return this.$root.monitorList[monitor.id].type === "http" || this.$root.monitorList[monitor.id].type === "keyword" || this.$root.monitorList[monitor.id].type === "json-query";
            }
            return monitor.sendUrl && monitor.url && monitor.url !== "https://";
        },

        /**
         * Returns formatted certificate expiry or Bad cert message
         * @param {object} monitor Monitor to show expiry for
         * @returns {string} Certificate expiry message
         */
        formattedCertExpiryMessage(monitor) {
            if (monitor?.validCert && monitor?.certExpiryDaysRemaining) {
                return monitor.certExpiryDaysRemaining + " " + this.$tc("day", monitor.certExpiryDaysRemaining);
            } else if (monitor?.validCert === false) {
                return this.$t("noOrBadCertificate");
            } else {
                return this.$t("Unknown") + " " + this.$tc("day", 2);
            }
        },

        /**
         * Returns certificate expiry color based on days remaining
         * @param {object} monitor Monitor to show expiry for
         * @returns {string} Color for certificate expiry
         */
        certExpiryColor(monitor) {
            if (monitor?.validCert && monitor.certExpiryDaysRemaining > 7) {
                return "#059669";
            }
            return "#DC2626";
        },
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars";

.group-title {
    display: flex;
    align-items: center;
}

.sort-controls-container {
    display: flex;
    justify-content: flex-start;
    margin-top: 0.5rem;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 0.5rem;
}

.sort-controls {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    font-size: 0.85rem; /* Smaller font for sort controls */
}

.sort-label {
    white-space: nowrap;
    margin-bottom: 0.25rem;
    font-weight: 500;
    color: #6c757d;
}

.sort-button {
    padding: 0.2rem 0.5rem;
    margin-left: 0.25rem;
    margin-bottom: 0.25rem; /* 为换行提供更好的间距 */
    background-color: transparent;
    border: 1px solid #dee2e6;
    color: #6c757d;
    transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out;
    white-space: nowrap; /* 防止按钮文字换行 */
    font-size: 0.75rem; /* 略微减小字体大小 */

    &:hover {
        background-color: #e9ecef;
        border-color: #adb5bd;
        color: #495057;
    }

    &.active {
        background-color: $primary;
        border-color: $primary;
        color: white;
    }

    .fa-arrow-up,
    .fa-arrow-down {
        margin-left: 0.3em;
    }
}

.dark {
    .sort-controls-container {
        border-bottom: 1px solid $dark-border-color;
        padding-bottom: 0.5rem;
    }
    
    .sort-label {
        color: $dark-font-color;
    }
    
    .sort-button {
        border-color: $dark-border-color;
        color: $dark-font-color;

        &:hover {
             background-color: lighten($dark-bg, 5%);
             border-color: lighten($dark-border-color, 10%);
             color: lighten($dark-font-color, 10%);
        }

        &.active {
            background-color: $primary;
            border-color: $primary;
            color: white;
        }
    }
}

.extra-info {
    display: flex;
    margin-bottom: 0.5rem;
}

.extra-info > div > div:first-child {
    margin-left: 0 !important;
}

.no-monitor-msg {
    position: absolute;
    width: 100%;
    top: 20px;
    left: 0;
}

.monitor-list {
    min-height: 46px;
}

.item-name {
    padding-left: 5px;
    padding-right: 5px;
    margin: 0;
    display: inline-block;
}

.btn-link {
    color: #bbbbbb;
    margin-left: 5px;
}

.link-active {
    color: $primary;
}

.flip-list-move {
    transition: transform 0.5s;
}

.no-move {
    transition: transform 0s;
}

.drag {
    color: #bbb;
    cursor: grab;
}

.remove {
    color: $danger;
}

.mobile {
    .item {
        padding: 13px 0 10px;
    }
}

.bg-maintenance {
    background-color: $maintenance;
}

</style>
