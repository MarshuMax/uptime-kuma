<template>
    <!-- Group List -->
    <div v-if="hasPublicGroups && !editMode" class="global-controls-container">
        <!-- 全局排序标题 -->
        <h5 class="text-center mb-3">{{ $t("Global Sorting Options") }}</h5>
        
        <!-- 全局搜索框 -->
        <div class="global-search-container mb-3">
            <div class="input-group">
                <input 
                    type="text" 
                    class="form-control" 
                    v-model="globalSearchKeyword" 
                    :placeholder="$t('Search across all monitors...')" 
                    aria-label="Global search"
                >
                <button 
                    v-if="globalSearchKeyword" 
                    class="btn btn-outline-secondary" 
                    type="button" 
                    @click="clearGlobalSearch"
                    title="Clear search"
                >
                    <font-awesome-icon icon="times" />
                </button>
            </div>
            <small v-if="globalSearchResultCount !== null" class="text-muted">
                {{ $t("Found {0} monitors", [globalSearchResultCount]) }}
            </small>
        </div>
        
        <!-- 全局排序栏 -->
        <div class="global-sort-container mb-4">
            <div class="sort-controls-container global-sort-bar">
                <div class="sort-controls">
                    <span class="sort-label me-2">{{ $t("Sort All Groups By") }}:</span>
                    <button
                        class="btn btn-sm sort-button"
                        :class="{'active': globalSortKey === 'status' && isGlobalSortActive && !hasAnyGroupWithIndependentSort}"
                        @click="setGlobalSort('status')"
                    >
                        {{ $t("Status") }}
                        <font-awesome-icon v-if="globalSortKey === 'status' && isGlobalSortActive" :icon="globalSortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" />
                    </button>
                    <button
                        class="btn btn-sm sort-button"
                        :class="{'active': globalSortKey === 'name' && isGlobalSortActive && !hasAnyGroupWithIndependentSort}"
                        @click="setGlobalSort('name')"
                    >
                        {{ $t("Name") }}
                        <font-awesome-icon v-if="globalSortKey === 'name' && isGlobalSortActive" :icon="globalSortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" />
                    </button>
                    <button
                        class="btn btn-sm sort-button"
                        :class="{'active': globalSortKey === 'uptime' && isGlobalSortActive && !hasAnyGroupWithIndependentSort}"
                        @click="setGlobalSort('uptime')"
                    >
                        {{ $t("Uptime") }}
                        <font-awesome-icon v-if="globalSortKey === 'uptime' && isGlobalSortActive" :icon="globalSortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" />
                    </button>
                    <button
                        v-if="showCertificateExpiry"
                        class="btn btn-sm sort-button"
                        :class="{'active': globalSortKey === 'cert' && isGlobalSortActive && !hasAnyGroupWithIndependentSort}"
                        @click="setGlobalSort('cert')"
                    >
                        {{ $t("Cert Exp.") }}
                        <font-awesome-icon v-if="globalSortKey === 'cert' && isGlobalSortActive" :icon="globalSortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" />
                    </button>
                    
                    <button
                        class="btn btn-sm ms-3"
                        :class="{
                            'btn-primary': isGlobalSortActive && !hasAnyGroupWithIndependentSort,
                            'btn-outline-primary': isGlobalSortActive && hasAnyGroupWithIndependentSort,
                            'btn-outline-secondary': !isGlobalSortActive
                        }"
                        @click="toggleGlobalSort"
                        title="启用/禁用全局排序"
                    >
                        <font-awesome-icon :icon="isGlobalSortActive ? 'check-circle' : 'times-circle'" class="me-1" />
                        {{ isGlobalSortActive ? $t('Global Sort Enabled') : $t('Global Sort Disabled') }}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <Draggable
        v-if="$root && $root.publicGroupList"
        v-model="$root.publicGroupList"
        :disabled="!editMode"
        item-key="id"
        :animation="100"
    >
        <template #item="group">
            <div v-if="group && group.element" class="mb-5" data-testid="group" v-show="shouldShowGroup(group.element)">
                <!-- Group Title -->
                <h2 class="group-title">
                    <font-awesome-icon v-if="editMode && showGroupDrag" icon="arrows-alt-v" class="action drag me-3" />
                    <font-awesome-icon v-if="editMode" icon="times" class="action remove me-3" @click="removeGroup(group.index)" />
                    <Editable v-model="group.element.name" :contenteditable="editMode" tag="span" data-testid="group-name" />
                </h2>

                <!-- Sort Buttons 与 搜索框 放在同一行 -->
                <div v-if="!editMode && group.element && group.element.monitorList && group.element.monitorList.length > 0" 
                    class="sort-controls-container mb-3"
                    :class="{
                        'global-active': isGlobalSortActive && !group.element.useOwnSort,
                        'local-active': isGlobalSortActive && group.element.useOwnSort
                    }">
                    <div class="sort-controls">
                        <span class="sort-label me-2">
                            {{ $t("Sort By") }}:
<!--                            <span v-if="isGlobalSortActive && !group.element.useOwnSort" class="small text-primary ms-1" title="全局排序已启用">-->
<!--                                ({{ $t("Global") }})-->
<!--                            </span>-->
<!--                            <span v-if="isGlobalSortActive && group.element.useOwnSort" class="small text-success ms-1" title="此组使用独立排序">-->
<!--                                ({{ $t("Custom") }})-->
<!--                            </span>-->
                        </span>
                        <button
                            class="btn btn-sm sort-button"
                            :class="{
                                'active': (isGlobalSortActive && !group.element.useOwnSort && globalSortKey === 'status') || 
                                         ((isGlobalSortActive && group.element.useOwnSort || !isGlobalSortActive) && group.element.sortKey === 'status')
                            }"
                            @click="setSort(group.element, 'status')"
                        >
                            {{ $t("Status") }}
                            <font-awesome-icon 
                                v-if="(isGlobalSortActive && !group.element.useOwnSort && globalSortKey === 'status') || 
                                      ((isGlobalSortActive && group.element.useOwnSort || !isGlobalSortActive) && group.element.sortKey === 'status')" 
                                :icon="(isGlobalSortActive && !group.element.useOwnSort ? globalSortDirection : group.element.sortDirection) === 'asc' ? 'arrow-up' : 'arrow-down'" 
                            />
                        </button>
                        <button
                            class="btn btn-sm sort-button"
                            :class="{
                                'active': (isGlobalSortActive && !group.element.useOwnSort && globalSortKey === 'name') || 
                                         ((isGlobalSortActive && group.element.useOwnSort || !isGlobalSortActive) && group.element.sortKey === 'name')
                            }"
                            @click="setSort(group.element, 'name')"
                        >
                            {{ $t("Name") }}
                            <font-awesome-icon 
                                v-if="(isGlobalSortActive && !group.element.useOwnSort && globalSortKey === 'name') || 
                                      ((isGlobalSortActive && group.element.useOwnSort || !isGlobalSortActive) && group.element.sortKey === 'name')" 
                                :icon="(isGlobalSortActive && !group.element.useOwnSort ? globalSortDirection : group.element.sortDirection) === 'asc' ? 'arrow-up' : 'arrow-down'" 
                            />
                        </button>
                        <button
                            class="btn btn-sm sort-button"
                            :class="{
                                'active': (isGlobalSortActive && !group.element.useOwnSort && globalSortKey === 'uptime') || 
                                         ((isGlobalSortActive && group.element.useOwnSort || !isGlobalSortActive) && group.element.sortKey === 'uptime')
                            }"
                            @click="setSort(group.element, 'uptime')"
                        >
                            {{ $t("Uptime") }}
                            <font-awesome-icon 
                                v-if="(isGlobalSortActive && !group.element.useOwnSort && globalSortKey === 'uptime') || 
                                      ((isGlobalSortActive && group.element.useOwnSort || !isGlobalSortActive) && group.element.sortKey === 'uptime')" 
                                :icon="(isGlobalSortActive && !group.element.useOwnSort ? globalSortDirection : group.element.sortDirection) === 'asc' ? 'arrow-up' : 'arrow-down'" 
                            />
                        </button>
                        <button
                            v-if="showCertificateExpiry"
                            class="btn btn-sm sort-button"
                            :class="{
                                'active': (isGlobalSortActive && !group.element.useOwnSort && globalSortKey === 'cert') || 
                                         ((isGlobalSortActive && group.element.useOwnSort || !isGlobalSortActive) && group.element.sortKey === 'cert')
                            }"
                            @click="setSort(group.element, 'cert')"
                        >
                            {{ $t("Cert Exp.") }}
                            <font-awesome-icon 
                                v-if="(isGlobalSortActive && !group.element.useOwnSort && globalSortKey === 'cert') || 
                                      ((isGlobalSortActive && group.element.useOwnSort || !isGlobalSortActive) && group.element.sortKey === 'cert')" 
                                :icon="(isGlobalSortActive && !group.element.useOwnSort ? globalSortDirection : group.element.sortDirection) === 'asc' ? 'arrow-up' : 'arrow-down'" 
                            />
                        </button>
                    </div>
                    
                    <!-- 组内搜索框 -->
                    <div v-if="group.element && group.element.monitorList" class="search-container">
                        <div class="search-input-wrapper">
                            <input 
                                type="text" 
                                v-model="group.element.searchKeyword" 
                                :placeholder="$t('Search...')" 
                                class="search-input form-control form-control-sm"
                                @keyup.esc="clearSearch(group.element)"
                            >
                            <button 
                                class="search-button btn btn-sm"
                                @click="clearSearch(group.element)"
                                v-if="group.element && group.element.searchKeyword"
                                title="清除搜索"
                            >
                                <font-awesome-icon icon="times" />
                            </button>
                        </div>
                    </div>
                </div>

                <div class="shadow-box monitor-list mt-4 position-relative">
                    <div v-if="!group.element || !group.element.monitorList || group.element.monitorList.length === 0" class="text-center no-monitor-msg">
                        {{ $t("No Monitors") }}
                    </div>
                    <div v-else-if="getFilteredMonitorList(group.element).length === 0" class="text-center no-monitor-msg">
                        {{ $t("No services found") }}
                    </div>

                    <!-- Monitor List -->
                    <!-- animation is not working, no idea why -->
                    <Draggable
                        v-if="group.element && group.element.monitorList && group.element.monitorList.length > 0"
                        v-model="group.element.monitorList"
                        class="monitor-list"
                        group="same-group"
                        :disabled="!editMode"
                        :animation="100"
                        item-key="id"
                    >
                        <template #item="{ element: monitor, index: monitorIndex }">
                            <div v-if="shouldShowMonitor(monitor, group.element)" class="item" data-testid="monitor">
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
        },
        monitorList: {
            type: Array,
            default: () => [],
        },
        groups: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            globalSearchKeyword: '',
            searchText: "",
            globalSortKey: 'status',
            globalSortDirection: 'desc',
            isGlobalSortActive: false,
        };
    },
    computed: {
        showGroupDrag() {
            return (this.$root && this.$root.publicGroupList && this.$root.publicGroupList.length >= 2);
        },
        hasMonitors() {
            return this.groups && Array.isArray(this.groups) && this.groups.some(group => 
                group && group.element && group.element.monitorList && group.element.monitorList.length > 0
            );
        },
        hasPublicGroups() {
            return this.$root && 
                   this.$root.publicGroupList && 
                   Array.isArray(this.$root.publicGroupList) && 
                   this.$root.publicGroupList.length > 0 &&
                   this.$root.publicGroupList.some(group => 
                       group && group.monitorList && group.monitorList.length > 0
                   );
        },
        filteredMonitorList() {
            if (!this.searchText || !this.monitorList) {
                return this.monitorList || [];
            }
            
            const searchLower = this.searchText.toLowerCase();
            return this.monitorList.filter(monitor => 
                monitor && monitor.name && monitor.name.toLowerCase().includes(searchLower)
            );
        },
        shouldShowSearch() {
            return !this.editMode && this.monitorList && this.monitorList.length > 0;
        },
        globalSearchResultCount() {
            if (!this.globalSearchKeyword) {
                return null;
            }
            
            let count = 0;
            if (!this.groups) return count;
            
            for (const group of this.groups) {
                if (!group || !group.element || !group.element.monitorList) continue;
                
                for (const monitor of group.element.monitorList) {
                    if (monitor && this.matchesGlobalSearch(monitor)) {
                        count++;
                    }
                }
            }
            return count;
        },
        hasAnyGroupWithIndependentSort() {
            if (!this.$root || !this.$root.publicGroupList) {
                return false;
            }
            
            return this.$root.publicGroupList.some(group => 
                group && group.useOwnSort === true
            );
        },
    },
    watch: {
        // Watch for changes in heartbeatList to re-apply sort
        '$root.heartbeatList': {
            handler() {
                if (this.$root && this.$root.publicGroupList) {
                    this.$root.publicGroupList.forEach(group => {
                        if (group) {
                            this.applySort(group);
                        }
                    });
                }
            },
            deep: true,
        },
        // Watch for changes in uptimeList to re-apply sort
        '$root.uptimeList': {
             handler() {
                if (this.$root && this.$root.publicGroupList) {
                    this.$root.publicGroupList.forEach(group => {
                        if (group) {
                            this.applySort(group);
                        }
                    });
                }
            },
            deep: true,
        },
        // 监听全局排序变化
        globalSortKey: {
            handler() {
                this.applyGlobalSort();
            }
        },
        globalSortDirection: {
            handler() {
                this.applyGlobalSort();
            }
        }
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

        // 尝试从 localStorage 中读取保存的全局排序设置
        try {
            const storageKey = `uptime-kuma-global-sort-${this.slug}`;
            const savedGlobalSettings = localStorage.getItem(storageKey);
            if (savedGlobalSettings) {
                const settings = JSON.parse(savedGlobalSettings);
                this.globalSortKey = settings.key;
                this.globalSortDirection = settings.direction;
                // 同时恢复全局排序激活状态
                this.isGlobalSortActive = settings.active === undefined ? false : settings.active;
            }
        } catch (error) {
            console.error('无法读取全局排序设置', error);
        }

        // Initialize sort state and apply initial sort for existing groups
        if (this.$root.publicGroupList) {
            this.$root.publicGroupList.forEach(group => {
                if (group) {
                    // 初始化搜索关键词
                    if (group.searchKeyword === undefined) {
                        group.searchKeyword = '';
                    }
                    
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
                }
            });
        }

        // 初始化后应用全局排序
        this.applyGlobalSort();

        // Watch for new groups being added and initialize their sort state
        if (this.$root) {
            this.$root.$watch('publicGroupList', (newGroups) => {
                if (newGroups) {
                    newGroups.forEach(group => {
                        if (group) {
                            // 确保每个组都有搜索关键词属性
                            if (group.searchKeyword === undefined) {
                                group.searchKeyword = '';
                            }
                            
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
                        }
                    });
                }
            }, { deep: true });
        }
    },
    unmounted() {
        // 清理组件卸载时的引用，避免内存泄漏
        // Vue 3 中 watcher 会在组件卸载时自动清理，不需要手动解除
    },
    methods: {
        /**
         * 判断监控项是否与搜索关键词匹配
         * @param {object} monitor 监控项对象
         * @param {string} keyword 搜索关键词
         * @returns {boolean} 是否匹配
         */
        monitorMatchesSearch(monitor, keyword) {
            if (!keyword) return true;
            if (!monitor) return false;
            
            keyword = keyword.toLowerCase().trim();
            
            // 搜索名称、URL和描述字段
            return (monitor.name && monitor.name.toLowerCase().includes(keyword)) || 
                   (monitor.url && monitor.url.toLowerCase().includes(keyword)) || 
                   (monitor.description && monitor.description.toLowerCase().includes(keyword));
        },
        
        /**
         * 判断监控项是否符合全局搜索条件
         * @param {object} monitor 监控项对象
         * @returns {boolean} 是否匹配
         */
        matchesGlobalSearch(monitor) {
            if (!this.globalSearchKeyword) return true;
            if (!monitor) return false;
            
            return this.monitorMatchesSearch(monitor, this.globalSearchKeyword);
        },
        
        /**
         * 判断监控项是否应该在界面上显示
         * @param {object} monitor 监控项对象
         * @param {object} group 分组对象
         * @returns {boolean} 是否显示
         */
        shouldShowMonitor(monitor, group) {
            if (!monitor) return false;
            
            // 先检查全局搜索
            if (this.globalSearchKeyword && !this.matchesGlobalSearch(monitor)) {
                return false;
            }
            
            // 再检查组内搜索
            if (group && group.searchKeyword) {
                return this.monitorMatchesSearch(monitor, group.searchKeyword);
            }
            
            return true;
        },
        
        /**
         * 获取过滤后的监控列表
         * @param {object} group 分组对象
         * @returns {array} 过滤后的监控列表
         */
        getFilteredMonitorList(group) {
            if (!group || !group.monitorList || !Array.isArray(group.monitorList)) return [];
            
            let result = [...group.monitorList]; // 创建副本避免修改原数组
            
            // 先应用全局搜索
            if (this.globalSearchKeyword) {
                result = result.filter(monitor => 
                    monitor && this.matchesGlobalSearch(monitor)
                );
            }
            
            // 再应用组内搜索
            if (group.searchKeyword) {
                result = result.filter(monitor => 
                    monitor && this.monitorMatchesSearch(monitor, group.searchKeyword)
                );
            }
            
            return result;
        },
        
        /**
         * 判断是否应该显示分组
         * @param {object} group 分组对象
         * @returns {boolean} 是否应该显示
         */
        shouldShowGroup(group) {
            if (!group) return false;
            
            // 编辑模式下总是显示
            if (this.editMode) return true;
            
            // 如果有全局搜索，只显示包含匹配监控项的分组
            if (this.globalSearchKeyword) {
                return group.monitorList && group.monitorList.some(monitor => 
                    this.matchesGlobalSearch(monitor)
                );
            }
            
            return true;
        },
        
        /**
         * 清除组内搜索关键词
         * @param {object} group 分组对象
         */
        clearSearch(group) {
            if (group) {
                group.searchKeyword = '';
            }
        },
        
        /**
         * 清除全局搜索关键词
         */
        clearGlobalSearch() {
            this.globalSearchKeyword = '';
        },
        
        /**
         * Set sort key and direction for a group, then apply the sort
         * @param {object} group The group object
         * @param {string} key The sort key ('status', 'name', 'uptime', 'cert')
         */
        setSort(group, key) {
            // 即使全局排序激活，也只改变当前组的排序设置
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
            
            // 如果全局排序激活，我们需要暂时禁用全局排序来应用组的排序
            const wasGlobalSortActive = this.isGlobalSortActive;
            
            // 暂时禁用全局排序
            if (wasGlobalSortActive) {
                // 为当前组设置独立排序标志
                group.useOwnSort = true;
            }
            
            // 应用排序到此组
            this.applySortToGroup(group);
        },

        /**
         * 应用排序到特定组，考虑组独立排序设置
         * @param {object} group 组对象
         */
        applySortToGroup(group) {
            if (!group || !group.monitorList || !Array.isArray(group.monitorList)) {
                return;
            }
            
            // 检查组是否有独立排序设置
            if (group.useOwnSort || !this.isGlobalSortActive) {
                // 使用组自己的排序设置
                const sortKey = group.sortKey || 'status';
                const sortDirection = group.sortDirection || 'desc';
                this.sortMonitorList(group.monitorList, sortKey, sortDirection);
            } else {
                // 使用全局排序设置
                this.sortMonitorList(group.monitorList, this.globalSortKey, this.globalSortDirection);
            }
        },

        /**
         * Apply sorting logic directly to the group's monitorList (in-place)
         * @param {object} group The group object containing monitorList
         */
        applySort(group) {
            this.applySortToGroup(group);
        },

        /**
         * 对监控列表进行排序，不修改组的排序设置
         * @param {array} monitorList 要排序的监控列表
         * @param {string} sortKey 排序键
         * @param {string} sortDirection 排序方向
         */
        sortMonitorList(monitorList, sortKey, sortDirection) {
            if (!Array.isArray(monitorList)) {
                return;
            }

            monitorList.sort((a, b) => {
                if (!a || !b) return 0;
                
                let comparison = 0;
                let valueA, valueB;

                if (sortKey === 'status') {
                    const getStatusPriority = (monitor) => {
                        if (!monitor || !monitor.id) return 4;
                        
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
                    const uptimeA = a.id ? parseFloat(uptimeList[`${a.id}_24`]) || 0 : 0;
                    const uptimeB = b.id ? parseFloat(uptimeList[`${b.id}_24`]) || 0 : 0;
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

        toggleGlobalSort() {
            this.isGlobalSortActive = !this.isGlobalSortActive;
            
            // 当切换全局排序状态时，重置所有组的独立排序标志
            if (this.$root && this.$root.publicGroupList) {
                this.$root.publicGroupList.forEach(group => {
                    if (group) {
                        group.useOwnSort = false;
                    }
                });
            }
            
            // 保存设置
            try {
                const storageKey = `uptime-kuma-global-sort-${this.slug}`;
                const globalSortSettings = {
                    key: this.globalSortKey,
                    direction: this.globalSortDirection,
                    active: this.isGlobalSortActive
                };
                localStorage.setItem(storageKey, JSON.stringify(globalSortSettings));
            } catch (error) {
                console.error('无法保存全局排序设置', error);
            }
            
            // 根据全局排序状态应用适当的排序
            if (this.isGlobalSortActive) {
                this.applyGlobalSort();
            } else {
                // 恢复各组独立排序
                if (this.$root && this.$root.publicGroupList) {
                    this.$root.publicGroupList.forEach(group => {
                        if (group) {
                            this.applySort(group);
                        }
                    });
                }
            }
        },

        /**
         * Set global sort key and direction
         * @param {string} key The sort key ('status', 'name', 'uptime', 'cert')
         */
        setGlobalSort(key) {
            // 更新全局排序设置
            if (this.globalSortKey === key) {
                this.globalSortDirection = this.globalSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.globalSortKey = key;
                this.globalSortDirection = (key === 'status') ? 'desc' : 'asc';
            }
            
            // 激活全局排序
            this.isGlobalSortActive = true;
            
            // 清除所有组的独立排序标志
            if (this.$root && this.$root.publicGroupList) {
                this.$root.publicGroupList.forEach(group => {
                    if (group) {
                        group.useOwnSort = false;
                    }
                });
            }
            
            // 保存全局排序设置到 localStorage
            try {
                const storageKey = `uptime-kuma-global-sort-${this.slug}`;
                
                // 保存全局排序设置
                const globalSortSettings = {
                    key: this.globalSortKey,
                    direction: this.globalSortDirection,
                    active: this.isGlobalSortActive
                };
                localStorage.setItem(storageKey, JSON.stringify(globalSortSettings));
            } catch (error) {
                console.error('无法保存全局排序设置', error);
            }
            
            // 应用全局排序
            this.applyGlobalSort();
        },

        /**
         * 禁用全局排序，恢复各组独立排序
         */
        disableGlobalSort() {
            this.isGlobalSortActive = false;
            
            // 清除所有组的独立排序标志
            if (this.$root && this.$root.publicGroupList) {
                this.$root.publicGroupList.forEach(group => {
                    if (group) {
                        group.useOwnSort = false;
                    }
                });
            }
            
            // 保存设置
            try {
                const storageKey = `uptime-kuma-global-sort-${this.slug}`;
                const globalSortSettings = {
                    key: this.globalSortKey,
                    direction: this.globalSortDirection,
                    active: false
                };
                localStorage.setItem(storageKey, JSON.stringify(globalSortSettings));
            } catch (error) {
                console.error('无法保存全局排序设置', error);
            }
            
            // 恢复各组的原始排序
            if (this.$root && this.$root.publicGroupList) {
                this.$root.publicGroupList.forEach(group => {
                    if (group) {
                        this.applySort(group);
                    }
                });
            }
        },

        /**
         * Apply global sorting logic to all groups
         */
        applyGlobalSort() {
            if (!this.isGlobalSortActive || !this.$root || !this.$root.publicGroupList) {
                return;
            }
            
            // 应用全局排序设置到所有不使用独立排序的组
            this.$root.publicGroupList.forEach(group => {
                if (group && group.monitorList && !group.useOwnSort) {
                    // 使用全局排序设置进行排序
                    this.sortMonitorList(group.monitorList, this.globalSortKey, this.globalSortDirection);
                }
            });
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

.search-container {
    margin-left: auto; /* 推到右侧 */
}

.search-input-wrapper {
    position: relative;
    display: flex;
}

.search-input {
    padding-right: 35px; /* 为清除按钮留出空间 */
    max-width: 200px;
    font-size: 0.85rem;
    border: 1px solid #dee2e6;
}

.search-button {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    padding: 0 10px;
    background: transparent;
    border: none;
    color: #6c757d;
    cursor: pointer;
}

.search-button:hover {
    color: #495057;
}

.dark {
    .search-input {
        background-color: lighten($dark-bg, 5%);
        border-color: $dark-border-color;
        color: $dark-font-color;
    }
    
    .search-button {
        color: $dark-font-color;
    }
    
    .search-button:hover {
        color: white;
    }
}

.sort-controls-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 0.5rem;
    
    &.global-active {
        background-color: rgba(13, 110, 253, 0.05);
        border-radius: 4px;
        padding: 0.5rem;
        border: 1px dashed rgba(13, 110, 253, 0.3);
    }
    
    &.local-active {
        background-color: rgba(25, 135, 84, 0.05);
        border-radius: 4px;
        padding: 0.5rem;
        border: 1px dashed rgba(25, 135, 84, 0.3);
    }
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
        
        &.global-active {
            background-color: rgba(59, 130, 246, 0.1);
            border: 1px dashed rgba(59, 130, 246, 0.3);
        }
        
        &.local-active {
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px dashed rgba(16, 185, 129, 0.3);
        }
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

.global-controls-container {
    width: 100%;
    max-width: none;
    margin: 0 0 2rem 0;
    padding: 1rem;
    background-color: #f0f4f8;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e6ed;
}

.global-search-container {
    max-width: 600px;
    margin: 0 auto 1rem auto;
    
    .input-group {
        position: relative;
        
        .btn {
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
            z-index: 3;
        }
    }
    
    small {
        display: block;
        text-align: center;
        margin-top: 0.25rem;
    }
}

.global-sort-container {
    max-width: 100%;
    margin: 0 auto;
    
    .sort-controls-container {
        border-radius: 0.25rem;
        padding: 0.75rem;
        background-color: #ffffff;
        border: 1px solid #e0e6ed;
        margin-top: 0.5rem;
    }
    
    .sort-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }
    
    .sort-label {
        font-weight: 600;
        color: #495057;
        margin-right: 0.5rem;
    }
}

.dark {
    .global-controls-container {
        background-color: #2d3748;
        border-color: #4a5568;
    }
    
    .global-sort-container {
        .sort-controls-container {
            background-color: #1a202c;
            border-color: #4a5568;
        }
        
        .sort-label {
            color: #e2e8f0;
        }
    }
}

@media (max-width: 768px) {
    .sort-controls-container {
        flex-direction: column;
        align-items: flex-start;
    }

    .search-container {
        margin-left: 0;
        margin-top: 0.5rem;
        width: 100%;
    }

    .search-input {
        max-width: 100%;
    }
}

</style>
