<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UTabs
      :items="tabItems"
      :ui="{ container: 'relative w-full grow', list: { width: 'w-96' }, base: 'focus:outline-none h-full' }"
      class="grow flex flex-col"
    >
      <!-- NAS Status 탭 -->
      <template #nas="{ item }">
        <div class="p-4 space-y-6">
          <!-- 실험 정보 -->
          <UCard>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">실험 정보</h3>
              <UButton
                v-if="nasStatus === 'finished' && finalArchitecture"
                @click="openFinalArchitectureModal"
                color="green"
                size="sm"
                variant="outline"
                icon="i-heroicons-cpu-chip"
              >
                신경망 구조 보기
              </UButton>
            </div>
            <ModuleLabelValue v-model="nasExperimentInfo" />
          </UCard>
          <!-- Neural Architecture Search 결과 -->
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <h3 class="text-lg font-semibold">신경망 구조 탐색 결과</h3>
                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border" :class="getStatusStyle(nasStatus).container">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :class="getStatusStyle(nasStatus).indicator"></div>
                      <span class="text-sm font-medium" :class="getStatusStyle(nasStatus).text">
                        {{ getStatusText(nasStatus) }}
                      </span>
                      <div v-if="nasStatus === 'running'" class="ml-1">
                        <div class="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <UButton @click="refreshNASExperimentStatus" icon="i-heroicons-arrow-path" variant="ghost" size="sm">
                  새로고침
                </UButton>
              </div>
            </template>
            <ModuleDataTable
              v-model:columns="nasResultColumns"
              v-model:data="nasExperimentStatus"
              v-model:pending="nasExperimentStatusPending"
            >
              <template #epoch-data="{ row }">
                <span class="font-mono font-semibold">{{ row.epoch }}</span>
              </template>
              <template #steps-data="{ row }">
                <span class="font-mono text-sm text-gray-600">{{ row.totalSteps || 0 }} steps</span>
              </template>
              <template #avg_accuracy-data="{ row }">
                <span class="font-mono text-sm">{{ formatNumber(row.avg_accuracy) }}</span>
              </template>
              <template #avg_loss-data="{ row }">
                <span class="font-mono text-sm">{{ formatNumber(row.avg_loss) }}</span>
              </template>
              <template #actions-data="{ row, index }">
                <div class="flex gap-2">
                  <UTooltip text="chart">
                    <UButton @click="openChartModal(row)" variant="ghost" size="sm" icon="i-heroicons-chart-bar" />
                  </UTooltip>
                </div>
              </template>
            </ModuleDataTable>
          </UCard>
        </div>
      </template>
      <!-- 재학습 탭 -->
      <template #retrain="{ item }">
        <div class="p-4 space-y-6">
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold">재학습 실험 목록</h3>
                <UButton @click="openRetrainModal" icon="i-heroicons-plus" color="primary">
                  재학습
                </UButton>
              </div>
            </template>
            <ModuleDataTable
              v-model:columns="retrainColumns"
              v-model:data="retrainExperiments"
              v-model:pending="retrainExperimentsPending"
            >
              <template #exp_key-data="{ row }">
                <span class="font-mono text-sm">{{ row.exp_key }}</span>
              </template>
              <template #dataset_name-data="{ row }">
                <span class="text-sm">{{ row.auto_ml_config?.dataset_name || '-' }}</span>
              </template>
              <template #max_epochs-data="{ row }">
                <span class="font-mono text-sm">{{ row.auto_ml_config?.max_epochs || '-' }}</span>
              </template>
              <template #batch_size-data="{ row }">
                <span class="font-mono text-sm">{{ row.auto_ml_config?.batch_size || '-' }}</span>
              </template>
              <template #created_at-data="{ row }">
                <div class="text-sm">{{ formatDateTime(row.created_at) }}</div>
              </template>
              <template #actions-data="{ row }">
                <div class="flex gap-2">
                  <UTooltip text="details">
                    <UButton
                      @click="showRetrainDetail(row)"
                      icon="i-heroicons-eye"
                      variant="ghost"
                      size="sm"
                    />
                  </UTooltip>
                  <UTooltip text="delete">
                    <UButton @click="deleteRetrainExperiment(row.exp_key)" icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
                  </UTooltip>
                </div>
              </template>
            </ModuleDataTable>
          </UCard>
        </div>
      </template>
      <!-- 하이퍼파라미터 최적화 탭 -->
      <template #hpo="{ item }">
        <div class="p-4 space-y-6">
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold">하이퍼파라미터 최적화 실험 목록</h3>
                <UButton @click="openHyperparameterModal" icon="i-heroicons-plus" color="green">
                  최적화
                </UButton>
              </div>
            </template>
            <ModuleDataTable
              v-model:columns="hpoColumns"
              v-model:data="hpoExperiments"
              v-model:pending="hpoExperimentsPending"
            >
              <template #exp_key-data="{ row }">
                <span class="font-mono text-sm">{{ row.exp_key }}</span>
              </template>
              <template #dataset_name-data="{ row }">
                <span class="text-sm">{{ row.auto_ml_config?.dataset_name || '-' }}</span>
              </template>
              <template #tuner-data="{ row }">
                <UBadge :label="getSearchMethodText(row.auto_ml_config?.tuner)" color="green" />
              </template>
              <template #trial_number-data="{ row }">
                <span class="font-mono text-sm">{{ row.auto_ml_config?.trial_number || '-' }}</span>
              </template>
              <template #created_at-data="{ row }">
                <div class="text-sm">{{ formatDateTime(row.created_at) }}</div>
              </template>
              <template #actions-data="{ row }">
                <div class="flex gap-2">
                  <UTooltip text="details">
                    <UButton
                      @click="showHPODetail(row)"
                      icon="i-heroicons-eye"
                      variant="ghost"
                      size="sm"
                    />
                  </UTooltip>
                  <UTooltip text="delete">
                    <UButton @click="deleteHPOExperiment(row.exp_key)" icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
                  </UTooltip>
                </div>
              </template>
            </ModuleDataTable>
          </UCard>
        </div>
      </template>
    </UTabs>

    <!-- NAS 차트 모달 -->
    <UModal v-model="showChartModal" :ui="{ width: 'sm:max-w-6xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Training Progress - Epoch {{ selectedEpoch }}</h3>
            <div class="text-sm text-gray-500">총 스텝: {{ selectedChartData?.totalSteps || 0 }}</div>
          </div>
        </template>
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-white border rounded-lg">
              <h4 class="text-center py-4 font-medium text-gray-700 border-b">Training and Validation Accuracy</h4>
              <div class="p-4">
                <div ref="nasAccuracyChartRef" style="height: 400px;"></div>
                <div class="mt-4 pt-4 border-t bg-gray-50 p-3 rounded text-sm">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="font-medium text-gray-600">최고 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedChartData?.maxAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최저 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedChartData?.minAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">평균 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedChartData?.avgAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최종 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedChartData?.finalAcc) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-white border rounded-lg">
              <h4 class="text-center py-4 font-medium text-gray-700 border-b">Training and Validation Loss</h4>
              <div class="p-4">
                <div ref="nasLossChartRef" style="height: 400px;"></div>
                <div class="mt-4 pt-4 border-t bg-gray-50 p-3 rounded text-sm">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="font-medium text-gray-600">최저 손실:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedChartData?.minLoss) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최고 손실:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedChartData?.maxLoss) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">평균 손실:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedChartData?.avgLoss) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최종 손실:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedChartData?.finalLoss) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="closeChartModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 최종 아키텍처 모달 -->
    <UModal v-model="showFinalArchitectureModal" :ui="{ width: 'sm:max-w-4xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cpu-chip" class="text-green-500" />
            <h3 class="text-lg font-semibold">최종 신경망 구조</h3>
          </div>
        </template>
        <div class="space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-800">
              <UIcon name="i-heroicons-information-circle" class="inline mr-1" />
              NAS 프로세스가 완료되어 최적화된 신경망 구조가 생성되었습니다.
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
            <pre class="text-sm text-gray-800 whitespace-pre-wrap">{{ JSON.stringify(finalArchitecture, null, 2) }}</pre>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-between">
            <UButton @click="copyArchitecture" color="green" variant="outline" icon="i-heroicons-clipboard">
              복사
            </UButton>
            <UButton @click="closeFinalArchitectureModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 재학습 상세 모달 -->
    <UModal v-model="showRetrainDetailModal" :ui="{ width: 'sm:max-w-6xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-academic-cap" class="text-green-500" />
            <h3 class="text-lg font-semibold">재학습 상세 정보</h3>
          </div>
        </template>
        <div class="space-y-6">
          <UCard>
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-semibold">실험 정보</h4>
              <UButton
                v-if="selectedRetrainExperiment?.auto_ml_config?.arch"
                @click="openRetrainArchitectureModal"
                color="green"
                size="sm"
                variant="outline"
                icon="i-heroicons-cpu-chip"
              >
                신경망 구조 보기
              </UButton>
            </div>
            <ModuleLabelValue v-model="retrainExperimentInfo" />
          </UCard>
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <h4 class="text-lg font-semibold">재학습 결과</h4>
                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border" :class="getStatusStyle(selectedRetrainExperiment?.status || 'pending').container">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :class="getStatusStyle(retrainStatus).indicator"></div>
                      <span class="text-sm font-medium" :class="getStatusStyle(retrainStatus).text">
                        {{ getStatusText(retrainStatus) }}
                      </span>
                      <div v-if="retrainStatus === 'running'" class="ml-1">
                        <div class="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <UButton @click="refreshRetrainExperimentStatus" icon="i-heroicons-arrow-path" variant="ghost" size="sm">
                  새로고침
                </UButton>
              </div>
            </template>
            <ModuleDataTable
              v-model:columns="retrainResultColumns"
              v-model:data="retrainExperimentStatus"
              v-model:pending="retrainExperimentStatusPending"
            >
              <template #epoch-data="{ row }">
                <span class="font-mono font-semibold">{{ row.epoch }}</span>
              </template>
              <template #steps-data="{ row }">
                <span class="font-mono text-sm text-gray-600">{{ row.totalSteps || 0 }} steps</span>
              </template>
              <template #avg_accuracy-data="{ row }">
                <span class="font-mono text-sm">{{ formatNumber(row.avg_accuracy) }}</span>
              </template>
              <template #avg_loss-data="{ row }">
                <span class="font-mono text-sm">{{ formatNumber(row.avg_loss) }}</span>
              </template>
              <template #actions-data="{ row, index }">
                <div class="flex gap-2">
                  <UTooltip text="chart">
                    <UButton @click="openRetrainChartModal(row)" variant="ghost"size="sm" icon="i-heroicons-chart-bar" />
                  </UTooltip>
                </div>
              </template>
            </ModuleDataTable>
          </UCard>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="closeRetrainDetailModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 재학습 아키텍처 모달 -->
    <UModal v-model="showRetrainArchitectureModal" :ui="{ width: 'sm:max-w-4xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cpu-chip" class="text-green-500" />
            <h3 class="text-lg font-semibold">재학습 신경망 구조</h3>
          </div>
        </template>
        <div class="space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-800">
              <UIcon name="i-heroicons-information-circle" class="inline mr-1" />
              재학습에 사용된 신경망 구조입니다.
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
            <pre class="text-sm text-gray-800 whitespace-pre-wrap">{{ JSON.stringify(selectedRetrainExperiment?.auto_ml_config?.arch, null, 2) }}</pre>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-between">
            <UButton @click="copyRetrainArchitecture" color="green" variant="outline" icon="i-heroicons-clipboard">
              복사
            </UButton>
            <UButton @click="closeRetrainArchitectureModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 재학습 차트 모달 -->
    <UModal v-model="showRetrainChartModal" :ui="{ width: 'sm:max-w-6xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Retrain Progress - Epoch {{ selectedRetrainEpoch }}</h3>
            <div class="text-sm text-gray-500">총 스텝: {{ selectedRetrainChartData?.totalSteps || 0 }}</div>
          </div>
        </template>
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-white border rounded-lg">
              <h4 class="text-center py-4 font-medium text-gray-700 border-b">Training and Validation Accuracy</h4>
              <div class="p-4">
                <div ref="retrainAccuracyChartRef" style="height: 400px;"></div>
                <div class="mt-4 pt-4 border-t bg-gray-50 p-3 rounded text-sm">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="font-medium text-gray-600">최고 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedRetrainChartData?.maxAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최저 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedRetrainChartData?.minAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">평균 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedRetrainChartData?.avgAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최종 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedRetrainChartData?.finalAcc) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-white border rounded-lg">
              <h4 class="text-center py-4 font-medium text-gray-700 border-b">Training and Validation Loss</h4>
              <div class="p-4">
                <div ref="retrainLossChartRef" style="height: 400px;"></div>
                <div class="mt-4 pt-4 border-t bg-gray-50 p-3 rounded text-sm">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="font-medium text-gray-600">최저 손실:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedRetrainChartData?.minLoss) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최고 손실:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedRetrainChartData?.maxLoss) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">평균 손실:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedRetrainChartData?.avgLoss) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최종 손실:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedRetrainChartData?.finalLoss) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="closeRetrainChartModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 하이퍼파라미터 최적화 상세 모달 -->
    <UModal v-model="showHPODetailModal" :ui="{ width: 'sm:max-w-6xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="text-green-500" />
            <h3 class="text-lg font-semibold">하이퍼파라미터 최적화 상세 정보</h3>
          </div>
        </template>
        <div class="space-y-6">
          <UCard>
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-semibold">실험 정보</h4>
              <UButton
                v-if="selectedHPOExperiment?.auto_ml_config?.search_space"
                @click="openHPOConfigModal"
                color="green"
                size="sm"
                variant="outline"
                icon="i-heroicons-cog-6-tooth"
              >
                설정 보기
              </UButton>
            </div>
            <ModuleLabelValue v-model="hpoExperimentInfo" />
          </UCard>
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <h4 class="text-lg font-semibold">하이퍼파라미터 최적화 결과</h4>
                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border" :class="getStatusStyle(selectedHPOExperiment?.status || 'pending').container">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :class="getStatusStyle(hpoStatus).indicator"></div>
                      <span class="text-sm font-medium" :class="getStatusStyle(hpoStatus).text">
                        {{ getStatusText(hpoStatus) }}
                      </span>
                      <div v-if="hpoStatus === 'running'" class="ml-1">
                        <div class="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <UButton @click="refreshHPOExperimentStatus" icon="i-heroicons-arrow-path" variant="ghost" size="sm">
                  새로고침
                </UButton>
              </div>
            </template>
            <ModuleDataTable
              v-model:columns="hpoResultColumns"
              v-model:data="hpoExperimentStatus"
              v-model:pending="hpoExperimentStatusPending"
            >
              <template #job_id-data="{ row }">
                <span class="font-mono font-semibold">{{ row.job_id }}</span>
              </template>
              <template #status-data="{ row }">
                <UBadge
                  :color="row.status === 'SUCCEEDED' ? 'green' : row.status === 'WAITING' ? 'yellow' : 'gray'"
                  :label="row.status"
                />
              </template>
              <template #parameters-data="{ row }">
                <UPopover mode="hover">
                  <div class="truncate max-w-32">
                    {{ formatParameters(row.parameters) }}
                  </div>
                  <template #panel>
                    <div class="p-4 max-w-sm">
                      <div class="space-y-1 text-sm">
                        <div v-for="(value, key) in row.parameters" :key="key">
                          <span class="font-medium">{{ key }}:</span> {{ value }}
                        </div>
                      </div>
                    </div>
                  </template>
                </UPopover>
              </template>
              <template #final_metric-data="{ row }">
                <span class="font-mono text-sm">{{ formatNumber(row.final_metric_data) }}</span>
              </template>
              <template #duration-data="{ row }">
                <span class="text-sm">{{ formatDuration(row.duration) }}</span>
              </template>
              <template #actions-data="{ row, index }">
                <div class="flex gap-2">
                  <UTooltip text="chart">
                    <UButton v-if="row.metric && row.metric.length > 0" @click="openHPOChartModal(row)"
                      variant="ghost" size="sm" icon="i-heroicons-chart-bar" />
                  </UTooltip>
                </div>
              </template>
            </ModuleDataTable>
          </UCard>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="closeHPODetailModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 하이퍼파라미터 설정 보기 모달 -->
    <UModal v-model="showHPOConfigModal" :ui="{ width: 'sm:max-w-4xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cog-6-tooth" class="text-green-500" />
            <h3 class="text-lg font-semibold">하이퍼파라미터 최적화 설정</h3>
          </div>
        </template>
        <div class="space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-800">
              <UIcon name="i-heroicons-information-circle" class="inline mr-1" />
              하이퍼파라미터 최적화에 사용된 설정 정보입니다.
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
            <pre class="text-sm text-gray-800 whitespace-pre-wrap">{{ JSON.stringify(selectedHPOExperiment?.auto_ml_config?.search_space, null, 2) }}</pre>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-between">
            <UButton @click="copyHPOConfig" color="green" variant="outline" icon="i-heroicons-clipboard">
              복사
            </UButton>
            <UButton @click="closeHPOConfigModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 하이퍼파라미터 최적화 차트 모달 -->
    <UModal v-model="showHPOChartModal" :ui="{ width: 'sm:max-w-6xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Hyperparameter Trial - Job {{ selectedHPOEpoch }}</h3>
            <div class="text-sm text-gray-500">
              Final Accuracy: {{ formatNumber(selectedHPOChartData?.finalAcc) }}
            </div>
          </div>
        </template>
        <div class="space-y-6">
          <!-- 파라미터 정보 카드 추가 -->
          <UCard v-if="selectedHPOChartData?.parameters">
            <template #header>
              <h4 class="text-md font-semibold">Trial Parameters</h4>
            </template>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div v-for="(value, key) in selectedHPOChartData.parameters" :key="key">
                <span class="font-medium text-gray-600">{{ key }}:</span>
                <span class="ml-2 font-mono">{{ value }}</span>
              </div>
            </div>
          </UCard>
          <!-- 차트 영역 - Accuracy만 표시 -->
          <div class="grid grid-cols-1 gap-6">
            <div class="bg-white border rounded-lg">
              <h4 class="text-center py-4 font-medium text-gray-700 border-b">Accuracy Progress</h4>
              <div class="p-4">
                <div ref="hpoAccuracyChartRef" style="height: 400px;"></div>
                <div class="mt-4 pt-4 border-t bg-gray-50 p-3 rounded text-sm">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="font-medium text-gray-600">최고 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedHPOChartData?.maxAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">최종 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedHPOChartData?.finalAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">평균 정확도:</span>
                      <span class="ml-2 font-mono">{{ formatNumber(selectedHPOChartData?.avgAcc) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600">Trial Steps:</span>
                      <span class="ml-2 font-mono">{{ selectedHPOChartData?.totalSteps }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="closeHPOChartModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 재학습 모달 -->
    <UModal v-model="showRetrainModal" :ui="{ width: 'sm:max-w-4xl' }" prevent-close>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">재학습</h3>
        </template>
        <div class="space-y-6">
          <div class="text-sm text-gray-600 mb-4">
            탐색된 최적의 신경망 구조를 사용하여 처음부터 재학습을 수행합니다.
          </div>
          <div class="space-y-4">
            <h4 class="font-medium text-lg border-b pb-2">하이퍼파라미터</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Max Epochs" name="max_epochs" :error="retrainValidationErrors.max_epochs">
                <UInput
                  v-model.number="retrainConfig.max_epochs"
                  type="number"
                  min="1"
                  placeholder="예: 800"
                  variant="outline"
                />
              </UFormGroup>
              <UFormGroup label="Batch Size" name="batch_size" :error="retrainValidationErrors.batch_size">
                <UInput
                  v-model.number="retrainConfig.batch_size"
                  type="number"
                  min="1"
                  placeholder="예: 128"
                  variant="outline"
                />
              </UFormGroup>
              <UFormGroup label="Learning Rate" name="learning_rate" :error="retrainValidationErrors.learning_rate">
                <UInput
                  v-model.number="retrainConfig.learning_rate"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="예: 0.001"
                  variant="outline"
                />
              </UFormGroup>
              <UFormGroup label="Momentum" name="momentum" :error="retrainValidationErrors.momentum">
                <UInput
                  v-model.number="retrainConfig.momentum"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="예: 0.9"
                  variant="outline"
                />
              </UFormGroup>
              <UFormGroup label="Weight Decay" name="weight_decay" :error="retrainValidationErrors.weight_decay">
                <UInput
                  v-model.number="retrainConfig.weight_decay"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="예: 0.0001"
                  variant="outline"
                />
              </UFormGroup>
              <UFormGroup label="Auxiliary Loss Weight" name="auxiliary_loss_weight" :error="retrainValidationErrors.auxiliary_loss_weight">
                <UInput
                  v-model.number="retrainConfig.auxiliary_loss_weight"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="예: 0.4"
                  variant="outline"
                />
              </UFormGroup>
              <UFormGroup label="Drop Path Probability" name="drop_path_prob" :error="retrainValidationErrors.drop_path_prob">
                <UInput
                  v-model.number="retrainConfig.drop_path_prob"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="예: 0.2"
                  variant="outline"
                />
              </UFormGroup>
              <UFormGroup label="Width (≥4)" name="width" :error="retrainValidationErrors.width">
                <UInput
                  v-model.number="retrainConfig.width"
                  type="number"
                  min="4"
                  placeholder="예: 64"
                  variant="outline"
                />
              </UFormGroup>
              <UFormGroup label="Number of Cells (≥3)" name="num_cells" :error="retrainValidationErrors.num_cells">
                <UInput
                  v-model.number="retrainConfig.num_cells"
                  type="number"
                  min="3"
                  placeholder="예: 20"
                  variant="outline"
                />
              </UFormGroup>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton @click="closeRetrainModal" variant="ghost">취소</UButton>
            <UButton @click="submitRetrain" color="primary" :loading="submittingRetrain">재학습 시작</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 하이퍼파라미터 최적화 모달 -->
    <UModal v-model="showHyperparameterModal" :ui="{ width: 'sm:max-w-5xl' }" prevent-close>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">하이퍼파라미터 최적화</h3>
        </template>
        <div class="space-y-6">
          <div class="text-sm text-gray-600 mb-4">
            탐색된 최적의 신경망 구조를 바탕으로 최고 성능을 달성하는 하이퍼파라미터 조합을 자동으로 탐색합니다.
          </div>
          <div class="grid grid-cols-2 gap-6">
            <UFormGroup label="Tuner" name="tuner" :error="hpoValidationErrors.tuner">
              <USelect v-model="hpoConfig.tuner" :options="tunerOptions" variant="outline" />
            </UFormGroup>
            <UFormGroup label="Trial Number" name="trial_number" :error="hpoValidationErrors.trial_number">
              <UInput
                v-model.number="hpoConfig.trial_number"
                type="number"
                min="1"
                max="1000"
                placeholder="예: 50"
                variant="outline"
              />
            </UFormGroup>
          </div>
          <div class="space-y-6">
            <h4 class="font-medium text-lg border-b pb-2">하이퍼파라미터 범위 설정</h4>
            <!-- Max Epochs -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Max Epochs">
                <USelect v-model="hpoConfig.max_epochs_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.max_epochs_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.max_epochs_choices" placeholder="1, 800" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.max_epochs_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.max_epochs_min" type="number" step="1" min="1" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.max_epochs_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.max_epochs_max" type="number" step="1" min="1" />
              </UFormGroup>
            </div>
            <!-- Batch Size -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Batch Size">
                <USelect v-model="hpoConfig.batch_size_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.batch_size_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.batch_size_choices" placeholder="64, 128" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.batch_size_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.batch_size_min" type="number" step="1" min="1" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.batch_size_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.batch_size_max" type="number" step="1" min="1" />
              </UFormGroup>
            </div>
            <!-- Learning Rate -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Learning Rate">
                <USelect v-model="hpoConfig.learning_rate_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.learning_rate_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.learning_rate_choices" placeholder="0.025, 0.035" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.learning_rate_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.learning_rate_min" type="number" step="0.0001" min="0.0001" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.learning_rate_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.learning_rate_max" type="number" step="0.001" min="0.0001" />
              </UFormGroup>
            </div>
            <!-- Momentum -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Momentum">
                <USelect v-model="hpoConfig.momentum_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.momentum_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.momentum_choices" placeholder="0.9" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.momentum_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.momentum_min" type="number" step="0.01" min="0" max="1" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.momentum_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.momentum_max" type="number" step="0.01" min="0" max="1" />
              </UFormGroup>
            </div>
            <!-- Weight Decay -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Weight Decay">
                <USelect v-model="hpoConfig.weight_decay_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.weight_decay_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.weight_decay_choices" placeholder="0.0002, 0.0003" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.weight_decay_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.weight_decay_min" type="number" step="0.0001" min="0" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.weight_decay_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.weight_decay_max" type="number" step="0.0001" min="0" />
              </UFormGroup>
            </div>
            <!-- Auxiliary Loss Weight -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Auxiliary Loss Weight">
                <USelect v-model="hpoConfig.auxiliary_loss_weight_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.auxiliary_loss_weight_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.auxiliary_loss_weight_choices" placeholder="0.3, 0.4, 0.5" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.auxiliary_loss_weight_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.auxiliary_loss_weight_min" type="number" step="0.01" min="0" max="1" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.auxiliary_loss_weight_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.auxiliary_loss_weight_max" type="number" step="0.01" min="0" max="1" />
              </UFormGroup>
            </div>
            <!-- Width -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Width (≥4)">
                <USelect v-model="hpoConfig.width_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.width_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.width_choices" placeholder="32, 64" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.width_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.width_min" type="number" step="1" min="4" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.width_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.width_max" type="number" step="1" min="4" />
              </UFormGroup>
            </div>
            <!-- Num Cells -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Num Cells (≥3)">
                <USelect v-model="hpoConfig.num_cells_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.num_cells_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.num_cells_choices" placeholder="14, 20" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.num_cells_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.num_cells_min" type="number" step="1" min="3" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.num_cells_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.num_cells_max" type="number" step="1" min="3" />
              </UFormGroup>
            </div>
            <!-- Drop Path Prob -->
            <div class="grid grid-cols-4 gap-4 items-end">
              <UFormGroup label="Drop Path Prob">
                <USelect v-model="hpoConfig.drop_path_prob_type" :options="parameterTypeOptions" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.drop_path_prob_type === 'choice'" label="후보값 (쉼표로 구분)">
                <UInput v-model="hpoConfig.drop_path_prob_choices" placeholder="0.2, 0.3" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.drop_path_prob_type !== 'choice'" label="최소값">
                <UInput v-model.number="hpoConfig.drop_path_prob_min" type="number" step="0.01" min="0" max="1" />
              </UFormGroup>
              <UFormGroup v-if="hpoConfig.drop_path_prob_type !== 'choice'" label="최대값">
                <UInput v-model.number="hpoConfig.drop_path_prob_max" type="number" step="0.01" min="0" max="1" />
              </UFormGroup>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton @click="closeHyperparameterModal" variant="ghost">취소</UButton>
            <UButton @click="submitHPO" color="green" :loading="submittingHPO">최적화 시작</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { getNASExperimentDetails, getNASExperimentStatus, getRetrainExperiments, getHPOExperiments, startRetrain, startHPO, getRetrainExperimentStatus, getHPOExperimentStatus, removeAutoMLExperiments } from "~/composables/auto-ml";

const router = useRouter();
const route = useRoute();
const expKey = ref(route.params.id as string);

// 상태 관리
const nasExperimentStatusPending = ref(true);
const retrainExperimentsPending = ref(true);
const hpoExperimentsPending = ref(true);
const retrainExperimentStatusPending = ref(true);
const hpoExperimentStatusPending = ref(true);

const nasStatus = ref('pending');
const retrainStatus = ref('pending');
const hpoStatus = ref('pending');
const finalArchitecture = ref(null);

const submittingRetrain = ref(false);
const submittingHPO = ref(false);

// 차트 관련
const nasAccuracyChartRef = ref(null);
const nasLossChartRef = ref(null);
const retrainAccuracyChartRef = ref(null);
const retrainLossChartRef = ref(null);
const hpoAccuracyChartRef = ref(null);

const selectedEpoch = ref(0);
const selectedChartData = ref(null);
const selectedRetrainEpoch = ref(0);
const selectedRetrainChartData = ref(null);
const selectedHPOEpoch = ref(0);
const selectedHPOChartData = ref(null);

// 선택된 실험 정보
const selectedRetrainExperiment = ref(null);
const selectedHPOExperiment = ref(null);
const retrainExperimentInfo = ref([]);
const hpoExperimentInfo = ref([]);
const retrainExperimentStatus = ref([]);
const hpoExperimentStatus = ref([]);

// 실험 정보
const nasExperimentInfo = ref([
  { id: 'exp_key', label: 'Experiment Key', value: '' },
  { id: 'task', label: 'Task', value: '' },
  { id: 'created_at', label: 'Created At', value: '' }
]);

// 데이터
const nasExperimentStatus = ref([]);
const retrainExperiments = ref([]);
const hpoExperiments = ref([]);

// 모달 상태 - 각 모달에 고유한 함수 사용
const showRetrainModal = ref(false);
const showHyperparameterModal = ref(false);
const showChartModal = ref(false);
const showFinalArchitectureModal = ref(false);
const showRetrainDetailModal = ref(false);
const showRetrainArchitectureModal = ref(false);
const showRetrainChartModal = ref(false);
const showHPODetailModal = ref(false);
const showHPOConfigModal = ref(false);
const showHPOChartModal = ref(false);

// 검증 에러 상태
const retrainValidationErrors = ref({});
const hpoValidationErrors = ref({});

// 테이블 컬럼 설정
const nasResultColumns = ref([
  { key: 'epoch', label: 'Epoch', sortable: true },
  { key: 'steps', label: 'Steps' },
  { key: 'avg_accuracy', label: 'Avg Accuracy', sortable: true },
  { key: 'avg_loss', label: 'Avg Loss', sortable: true },
  { key: 'actions', label: '작업' }
]);

const retrainColumns = ref([
  { key: 'exp_key', label: '실험 키' },
  { key: 'dataset_name', label: '데이터셋' },
  { key: 'max_epochs', label: 'Max Epochs' },
  { key: 'batch_size', label: 'Batch Size' },
  { key: 'created_at', label: '생성일시' },
  { key: 'actions', label: '작업' }
]);

const retrainResultColumns = ref([
  { key: 'epoch', label: 'Epoch', sortable: true },
  { key: 'steps', label: 'Steps' },
  { key: 'avg_accuracy', label: 'Avg Accuracy', sortable: true },
  { key: 'avg_loss', label: 'Avg Loss', sortable: true },
  { key: 'actions', label: '작업' }
]);

const hpoColumns = ref([
  { key: 'exp_key', label: '실험 키' },
  { key: 'dataset_name', label: '데이터셋' },
  { key: 'tuner', label: 'Tuner' },
  { key: 'trial_number', label: 'Trial Number' },
  { key: 'created_at', label: '생성일시' },
  { key: 'actions', label: '작업' }
]);

const hpoResultColumns = ref([
  { key: 'job_id', label: 'Job ID' },
  { key: 'status', label: 'Status' },
  { key: 'parameters', label: 'Parameters' },
  { key: 'final_metric', label: 'Final Accuracy' },
  { key: 'duration', label: 'Duration' },
  { key: 'actions', label: '작업' }
]);

// 설정 객체
const retrainConfig = ref({
  max_epochs: 50,
  batch_size: 32,
  learning_rate: 0.001,
  width: 64,
  num_cells: 20,
  momentum: 0.9,
  weight_decay: 0.0001,
  auxiliary_loss_weight: 0.4,
  drop_path_prob: 0.2
});

const hpoConfig = ref({
  tuner: 'random',
  trial_number: 5,
  max_epochs_type: 'choice',
  max_epochs_choices: '1, 800',
  max_epochs_min: 1,
  max_epochs_max: 800,
  batch_size_type: 'randint',
  batch_size_choices: '64, 128',
  batch_size_min: 64,
  batch_size_max: 128,
  learning_rate_type: 'loguniform',
  learning_rate_choices: '0.025, 0.035',
  learning_rate_min: 0.025,
  learning_rate_max: 0.035,
  momentum_type: 'choice',
  momentum_choices: '0.9',
  momentum_min: 0.9,
  momentum_max: 0.9,
  weight_decay_type: 'loguniform',
  weight_decay_choices: '0.0002, 0.0003',
  weight_decay_min: 0.0002,
  weight_decay_max: 0.0003,
  auxiliary_loss_weight_type: 'choice',
  auxiliary_loss_weight_choices: '0.3, 0.4, 0.5',
  auxiliary_loss_weight_min: 0.3,
  auxiliary_loss_weight_max: 0.5,
  width_type: 'choice',
  width_choices: '32',
  width_min: 32,
  width_max: 32,
  num_cells_type: 'choice',
  num_cells_choices: '14, 20',
  num_cells_min: 14,
  num_cells_max: 20,
  drop_path_prob_type: 'choice',
  drop_path_prob_choices: '0.2, 0.3',
  drop_path_prob_min: 0.2,
  drop_path_prob_max: 0.3
});

// 페이지 정보
const breadcrumbs = ref([
  { label: 'Home', to: '/' },
  { label: 'Auto ML', to: '/auto-ml/' },
  { label: 'Details' }
]);

const pageTitle = ref('Auto ML Experiment Details');

// 탭 설정
const tabItems = ref([
  { slot: 'nas', label: 'NAS' },
  { slot: 'retrain', label: 'Retrain' },
  { slot: 'hpo', label: 'HPO' }
]);

// 옵션들
const tunerOptions = [
  { label: 'Random', value: 'random' },
  { label: 'TPE', value: 'tpe' },
  { label: 'Grid Search', value: 'gridsearch' }
];

const parameterTypeOptions = [
  { label: 'Choice', value: 'choice' },
  { label: 'Uniform', value: 'uniform' },
  { label: 'Log Uniform', value: 'loguniform' },
  { label: 'Random Int', value: 'randint' }
];

// 툴바 설정
const toolbarLinks = ref([
  [
    { label: '목록으로', icon: 'i-heroicons-arrow-uturn-left', click: () => router.back() }
  ],
  [
    { label: '새로고침', icon: 'i-heroicons-arrow-path', click: refreshAllData }
  ]
]);

// 모달 열기/닫기 함수들
function openRetrainModal() {
  showRetrainModal.value = true;
}

function closeRetrainModal() {
  showRetrainModal.value = false;
}

function openHyperparameterModal() {
  showHyperparameterModal.value = true;
}

function closeHyperparameterModal() {
  showHyperparameterModal.value = false;
}

function openFinalArchitectureModal() {
  showFinalArchitectureModal.value = true;
}

function closeFinalArchitectureModal() {
  showFinalArchitectureModal.value = false;
}

function closeChartModal() {
  showChartModal.value = false;
}

function closeRetrainDetailModal() {
  showRetrainDetailModal.value = false;
}

function openRetrainArchitectureModal() {
  showRetrainArchitectureModal.value = true;
}

function closeRetrainArchitectureModal() {
  showRetrainArchitectureModal.value = false;
}

function closeRetrainChartModal() {
  showRetrainChartModal.value = false;
}

function closeHPODetailModal() {
  showHPODetailModal.value = false;
}

function openHPOConfigModal() {
  showHPOConfigModal.value = true;
}

function closeHPOConfigModal() {
  showHPOConfigModal.value = false;
}

function closeHPOChartModal() {
  showHPOChartModal.value = false;
}

// 유틸리티 함수들
const formatNumber = (value) => value ? value.toFixed(6) : '-';
const formatDateTime = (dateString) => new Date(dateString).toLocaleString();

function getStatusStyle(status: string) {
  const styles = {
    'pending': { container: 'bg-gray-50 border-gray-200', indicator: 'bg-gray-400', text: 'text-gray-700' },
    'running': { container: 'bg-amber-50 border-amber-200', indicator: 'bg-amber-400 animate-pulse', text: 'text-amber-700' },
    'completed': { container: 'bg-green-50 border-green-200', indicator: 'bg-green-400', text: 'text-green-700' },
    'finished': { container: 'bg-emerald-50 border-emerald-200', indicator: 'bg-emerald-400', text: 'text-emerald-700' },
    'failed': { container: 'bg-red-50 border-red-200', indicator: 'bg-red-400', text: 'text-red-700' },
    'cancelled': { container: 'bg-gray-50 border-gray-200', indicator: 'bg-gray-400', text: 'text-gray-700' },
    'stop': { container: 'bg-gray-50 border-gray-200', indicator: 'bg-gray-400', text: 'text-gray-700' }
  };
  return styles[status] || styles['pending'];
}

function getStatusText(status: string) {
  const textMap = {
    'running': '진행중', 'completed': '완료', 'finished': '완료', 'failed': '실패',
    'cancelled': '중단됨', 'stop': '중단됨', 'pending': '대기중'
  };
  return textMap[status] || status;
}

function getSearchMethodText(method: string) {
  const methodMap = {
    'random': 'Random', 'tpe': 'TPE', 'gridsearch': 'Grid Search'
  };
  return methodMap[method] || method;
}

// 지속시간 포맷 함수
const formatDuration = (duration) => {
  if (duration <= 0) return '-';
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// 파라미터 표시 함수
const formatParameters = (params) => {
  if (!params) return '-';
  const key = Object.keys(params)[0];
  return `${key}: ${params[key]}`;
};

// 차트 관련 함수들
function openChartModal(row: any) {
  selectedEpoch.value = row.epoch;
  const accData = row.train_acc_data || [];
  const lossData = row.train_loss_data || [];

  selectedChartData.value = {
    totalSteps: accData.length,
    maxAcc: accData.length ? Math.max(...accData.map(d => d.y)) : 0,
    minAcc: accData.length ? Math.min(...accData.map(d => d.y)) : 0,
    avgAcc: row.avg_accuracy,
    finalAcc: accData.length ? accData[accData.length - 1].y : 0,
    maxLoss: lossData.length ? Math.max(...lossData.map(d => d.y)) : 0,
    minLoss: lossData.length ? Math.min(...lossData.map(d => d.y)) : 0,
    avgLoss: row.avg_loss,
    finalLoss: lossData.length ? lossData[lossData.length - 1].y : 0
  };

  showChartModal.value = true;

  nextTick(() => {
    renderChart(nasAccuracyChartRef.value, row.train_acc_data, 'Training Accuracy', '#3b82f6');
    renderChart(nasLossChartRef.value, row.train_loss_data, 'Training Loss', '#ef4444');
  });
}

function openRetrainChartModal(row: any) {
  selectedRetrainEpoch.value = row.epoch;
  const accData = row.train_acc_data || [];
  const lossData = row.train_loss_data || [];

  selectedRetrainChartData.value = {
    totalSteps: accData.length,
    maxAcc: accData.length ? Math.max(...accData.map(d => d.y)) : 0,
    minAcc: accData.length ? Math.min(...accData.map(d => d.y)) : 0,
    avgAcc: row.avg_accuracy,
    finalAcc: accData.length ? accData[accData.length - 1].y : 0,
    maxLoss: lossData.length ? Math.max(...lossData.map(d => d.y)) : 0,
    minLoss: lossData.length ? Math.min(...lossData.map(d => d.y)) : 0,
    avgLoss: row.avg_loss,
    finalLoss: lossData.length ? lossData[lossData.length - 1].y : 0
  };

  showRetrainChartModal.value = true;

  nextTick(() => {
    renderChart(retrainAccuracyChartRef.value, row.train_acc_data, 'Training Accuracy', '#3b82f6');
    renderChart(retrainLossChartRef.value, row.train_loss_data, 'Training Loss', '#ef4444');
  });
}

function openHPOChartModal(row: any) {
  selectedHPOEpoch.value = row.job_id;
  const metricData = row.train_acc_data || [];

  selectedHPOChartData.value = {
    totalSteps: metricData.length,
    maxAcc: metricData.length ? Math.max(...metricData.map(d => d.y)) : 0,
    minAcc: metricData.length ? Math.min(...metricData.map(d => d.y)) : 0,
    avgAcc: metricData.length ? metricData.reduce((sum, d) => sum + d.y, 0) / metricData.length : 0,
    finalAcc: row.final_metric_data || 0,
    maxLoss: 0,
    minLoss: 0,
    avgLoss: 0,
    finalLoss: 0,
    parameters: row.parameters
  };

  showHPOChartModal.value = true;

  nextTick(() => {
    if (metricData.length > 0) {
      renderChart(hpoAccuracyChartRef.value, row.train_acc_data, 'Accuracy Progress', '#8b5cf6');
    }
  });
}

// 차트 렌더링 함수
function renderChart(container: any, data: any[], label: string, color: string) {
  if (!container || !data.length) return;

  const padding = 80;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));

  // Y축 범위를 여유있게 확장 (10% 패딩)
  const yPadding = (maxY - minY) * 0.1 || (Math.abs(maxY) * 0.1) || 0.1;
  const extendedMaxY = maxY + yPadding;
  const extendedMinY = minY - yPadding;
  const range = extendedMaxY - extendedMinY;

  const maxX = Math.max(...data.map(d => d.x));
  const minX = Math.min(...data.map(d => d.x));
  const xRange = maxX - minX || 1;

  const yTicks = calculateTicks(extendedMinY, extendedMaxY, 5);
  const xTickCount = getOptimalXTickCount(minX, maxX, chartWidth);
  const xTicks = calculateTicks(minX, maxX, xTickCount);

  let chartHTML = `
    <svg width="100%" height="100%" style="background: white;">
      <rect x="${padding}" y="${padding}" width="${chartWidth}" height="${chartHeight}" fill="none" stroke="#e2e8f0" stroke-width="1"/>
  `;

  // Grid lines and labels
  yTicks.forEach(tick => {
    const y = padding + chartHeight - ((tick - extendedMinY) / range) * chartHeight;
    chartHTML += `
      <line x1="${padding}" y1="${y}" x2="${padding + chartWidth}" y2="${y}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="2,2"/>
      <text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280" font-family="monospace">${tick.toFixed(4)}</text>
    `;
  });

  xTicks.forEach(tick => {
    const x = padding + ((tick - minX) / xRange) * chartWidth;
    chartHTML += `
      <line x1="${x}" y1="${padding}" x2="${x}" y2="${padding + chartHeight}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="2,2"/>
      <text x="${x}" y="${height - padding + 20}" text-anchor="middle" font-size="11" fill="#6b7280">${Math.round(tick)}</text>
    `;
  });

  // 데이터가 2개 이상일 때만 선 그리기
  if (data.length > 1) {
    const pathData = data.map((d, i) => {
      const x = padding + ((d.x - minX) / xRange) * chartWidth;
      const y = padding + chartHeight - ((d.y - extendedMinY) / range) * chartHeight;
      return i === 0 ? `M${x},${y}` : `L${x},${y}`;
    }).join(' ');

    chartHTML += `
      <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    `;
  }

  const shouldShowPoints = getShouldShowPoints(data.length);

  // 점 표시
  if (shouldShowPoints.show) {
    if (data.length === 1) {
      // 단일 데이터 포인트
      const d = data[0];
      const x = padding + ((d.x - minX) / xRange) * chartWidth;
      const y = padding + chartHeight - ((d.y - extendedMinY) / range) * chartHeight;
      const isMax = d.y === maxY;
      const labelY = isMax ? y - 5 : y + 12;

      chartHTML += `
        <circle cx="${x}" cy="${y}" r="6" fill="white" stroke="${color}" stroke-width="2"/>
        <text x="${x + 2}" y="${labelY}" text-anchor="start" font-size="10" fill="#374151" font-weight="600">${d.y.toFixed(4)}</text>
      `;
    } else if (shouldShowPoints.showAll) {
      // 모든 점 표시하면서 극값에는 레이블도 표시
      const extremePoints = findExtremePointsWithoutOverlap(data, maxY, minY, minX, xRange, chartWidth, padding, chartHeight, extendedMinY, range);

      data.forEach((d) => {
        const x = padding + ((d.x - minX) / xRange) * chartWidth;
        const y = padding + chartHeight - ((d.y - extendedMinY) / range) * chartHeight;
        const isExtreme = d.y === maxY || d.y === minY;

        chartHTML += `
          <circle cx="${x}" cy="${y}" r="${getPointSize(data.length)}" fill="white" stroke="${color}" stroke-width="2"/>
        `;

        // 극값에는 레이블 표시
        if (isExtreme) {
          const extremePoint = extremePoints.find(ep => ep.x === d.x && ep.y === d.y);
          if (extremePoint) {
            chartHTML += `
              <text x="${extremePoint.labelX}" y="${extremePoint.labelY}" text-anchor="start" font-size="9" fill="#374151" font-weight="600">${d.y.toFixed(4)}</text>
            `;
          }
        }
      });
    } else {
      // 극값만 표시 (많은 데이터)
      const extremePoints = findExtremePointsWithoutOverlap(data, maxY, minY, minX, xRange, chartWidth, padding, chartHeight, extendedMinY, range);

      extremePoints.forEach(point => {
        const x = padding + ((point.x - minX) / xRange) * chartWidth;
        const y = padding + chartHeight - ((point.y - extendedMinY) / range) * chartHeight;

        chartHTML += `
          <circle cx="${x}" cy="${y}" r="${getPointSize(data.length) + 1}" fill="white" stroke="${color}" stroke-width="2"/>
          <text x="${point.labelX}" y="${point.labelY}" text-anchor="start" font-size="9" fill="#374151" font-weight="600">${point.y.toFixed(4)}</text>
        `;
      });
    }
  }

  chartHTML += `
    <text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="12" font-weight="600" fill="#374151">Steps</text>
    <text x="25" y="${height/2}" text-anchor="middle" font-size="12" font-weight="600" fill="#374151" transform="rotate(-90, 25, ${height/2})">${label}</text>
  </svg>`;

  container.innerHTML = chartHTML;
}

// 차트 관련 헬퍼 함수들
function getShouldShowPoints(dataLength: number): { show: boolean, showAll: boolean, maxPoints: number } {
  if (dataLength === 1) {
    return { show: true, showAll: true, maxPoints: 1 };
  } else if (dataLength <= 30) {
    return { show: true, showAll: true, maxPoints: dataLength };
  } else {
    return { show: true, showAll: false, maxPoints: 0 };
  }
}

function getPointSize(dataLength: number): number {
  if (dataLength === 1) return 6;
  if (dataLength <= 30) return 3;
  return 2;
}

function getOptimalXTickCount(minX: number, maxX: number, chartWidth: number): number {
  const xRange = maxX - minX;
  const maxTicksByWidth = Math.floor(chartWidth / 80);

  let optimalTicks;
  if (xRange <= 10) {
    optimalTicks = Math.min(xRange + 1, 6);
  } else if (xRange <= 50) {
    optimalTicks = 6;
  } else if (xRange <= 100) {
    optimalTicks = 7;
  } else if (xRange <= 500) {
    optimalTicks = 8;
  } else if (xRange <= 1000) {
    optimalTicks = 8;
  } else if (xRange <= 5000) {
    optimalTicks = 10;
  } else {
    optimalTicks = 12;
  }

  return Math.min(optimalTicks, maxTicksByWidth, 15);
}

function calculateTicks(min: number, max: number, maxTicks: number = 5): number[] {
  if (min === max) {
    return [min];
  }

  const ticks = [];
  ticks.push(min);

  if (maxTicks > 1) {
    ticks.push(max);
  }

  if (maxTicks > 2) {
    const middleCount = maxTicks - 2;
    for (let i = 1; i <= middleCount; i++) {
      const ratio = i / (middleCount + 1);
      const tick = min + (max - min) * ratio;
      ticks.splice(-1, 0, tick);
    }
  }

  return [...new Set(ticks)].sort((a, b) => a - b);
}

function findExtremePointsWithoutOverlap(data: any[], maxY: number, minY: number, minX: number, xRange: number, chartWidth: number, padding: number, chartHeight: number, extendedMinY: number, range: number): any[] {
  const result = [];

  const maxIndex = data.findIndex(d => d.y === maxY);
  if (maxIndex !== -1) {
    const d = data[maxIndex];
    const screenX = ((d.x - minX) / xRange) * chartWidth;
    const screenY = padding + chartHeight - ((d.y - extendedMinY) / range) * chartHeight;

    result.push({
      index: maxIndex,
      x: d.x,
      y: d.y,
      screenX,
      screenY,
      isMax: true,
      labelX: padding + screenX + 2,
      labelY: screenY - 5
    });
  }

  if (maxY !== minY) {
    const minIndex = data.findIndex(d => d.y === minY);
    if (minIndex !== -1) {
      const d = data[minIndex];
      const screenX = ((d.x - minX) / xRange) * chartWidth;
      const screenY = padding + chartHeight - ((d.y - extendedMinY) / range) * chartHeight;

      result.push({
        index: minIndex,
        x: d.x,
        y: d.y,
        screenX,
        screenY,
        isMax: false,
        labelX: padding + screenX + 2,
        labelY: screenY + 12
      });
    }
  }

  return result;
}

// 복사 함수들
function copyArchitecture() {
  if (finalArchitecture.value) {
    navigator.clipboard.writeText(JSON.stringify(finalArchitecture.value, null, 2));
    alert('아키텍처가 클립보드에 복사되었습니다.');
  }
}

function copyRetrainArchitecture() {
  if (selectedRetrainExperiment.value?.auto_ml_config?.arch) {
    navigator.clipboard.writeText(JSON.stringify(selectedRetrainExperiment.value.auto_ml_config.arch, null, 2));
    alert('아키텍처가 클립보드에 복사되었습니다.');
  }
}

function copyHPOConfig() {
  if (selectedHPOExperiment.value?.auto_ml_config?.search_space) {
    navigator.clipboard.writeText(JSON.stringify(selectedHPOExperiment.value.auto_ml_config.search_space, null, 2));
    alert('설정이 클립보드에 복사되었습니다.');
  }
}

// 상세보기 함수들
async function showRetrainDetail(retrainExperiment: any) {
  selectedRetrainExperiment.value = retrainExperiment;
  retrainExperimentStatus.value = [];
  retrainStatus.value = 'pending';

  retrainExperimentInfo.value = [
    { id: 'exp_key', label: 'Experiment Key', value: retrainExperiment.exp_key },
    { id: 'task', label: 'Task', value: retrainExperiment.task },
    { id: 'created_at', label: 'Created At', value: formatDateTime(retrainExperiment.created_at) },
    { id: 'dataset_name', label: 'Dataset Name', value: retrainExperiment.auto_ml_config?.dataset_name || '-' },
    { id: 'max_epochs', label: 'Max Epochs', value: retrainExperiment.auto_ml_config?.max_epochs || '-' },
    { id: 'batch_size', label: 'Batch Size', value: retrainExperiment.auto_ml_config?.batch_size || '-' },
    { id: 'learning_rate', label: 'Learning Rate', value: retrainExperiment.auto_ml_config?.learning_rate || '-' },
    { id: 'width', label: 'Width', value: retrainExperiment.auto_ml_config?.width || '-' },
    { id: 'num_cells', label: 'Number of Cells', value: retrainExperiment.auto_ml_config?.num_cells || '-' },
    { id: 'momentum', label: 'Momentum', value: retrainExperiment.auto_ml_config?.momentum || '-' },
    { id: 'weight_decay', label: 'Weight Decay', value: retrainExperiment.auto_ml_config?.weight_decay || '-' },
    { id: 'auxiliary_loss_weight', label: 'Auxiliary Loss Weight', value: retrainExperiment.auto_ml_config?.auxiliary_loss_weight || '-' },
    { id: 'drop_path_prob', label: 'Drop Path Probability', value: retrainExperiment.auto_ml_config?.drop_path_prob || '-' }
  ];

  showRetrainDetailModal.value = true;
  await loadRetrainExperimentStatus(retrainExperiment.exp_key);
}

async function showHPODetail(hpoExperiment: any) {
  selectedHPOExperiment.value = hpoExperiment;
  hpoExperimentStatus.value = [];
  hpoStatus.value = 'pending';

  hpoExperimentInfo.value = [
    { id: 'exp_key', label: 'Experiment Key', value: hpoExperiment.exp_key },
    { id: 'task', label: 'Task', value: hpoExperiment.task },
    { id: 'created_at', label: 'Created At', value: formatDateTime(hpoExperiment.created_at) },
    { id: 'dataset_name', label: 'Dataset Name', value: hpoExperiment.auto_ml_config?.dataset_name || '-' },
    { id: 'tuner', label: 'Tuner', value: hpoExperiment.auto_ml_config?.tuner || '-' },
    { id: 'trial_number', label: 'Trial Number', value: hpoExperiment.auto_ml_config?.trial_number || '-' },
    { id: 'total_jobs', label: 'Total Jobs', value: '-' },
    { id: 'completed_jobs', label: 'Completed Jobs', value: '-' },
    { id: 'best_accuracy', label: 'Best Accuracy', value: '-' }
  ];

  showHPODetailModal.value = true;
  await loadHPOExperimentStatus(hpoExperiment.exp_key);
  updateHPOExperimentInfo();
}

function updateHPOExperimentInfo() {
  const totalJobs = hpoExperimentStatus.value.length;
  const completedJobs = hpoExperimentStatus.value.filter(r => r.status === 'SUCCEEDED').length;
  const bestAccuracy = hpoExperimentStatus.value.length > 0
    ? Math.max(...hpoExperimentStatus.value.map(r => r.final_metric_data || 0))
    : 0;

  const totalJobsInfo = hpoExperimentInfo.value.find(item => item.id === 'total_jobs');
  const completedJobsInfo = hpoExperimentInfo.value.find(item => item.id === 'completed_jobs');
  const bestAccuracyInfo = hpoExperimentInfo.value.find(item => item.id === 'best_accuracy');

  if (totalJobsInfo) totalJobsInfo.value = totalJobs;
  if (completedJobsInfo) completedJobsInfo.value = completedJobs;
  if (bestAccuracyInfo) bestAccuracyInfo.value = formatNumber(bestAccuracy);
}

// 데이터 처리 함수들
function processNASExperimentStatus(data: any) {
  if (!data?.result?.content?.log) return [];

  const log = data.result.content.log;
  const results = [];

  nasStatus.value = data.result.content.status || 'pending';

  if (nasStatus.value === 'finished' && log.arch) {
    finalArchitecture.value = log.arch;
  }

  const steps = Object.keys(log.step || {});
  const epochGroups = {};

  for (const key of steps) {
    const epoch = log.epoch[key];
    if (!epochGroups[epoch]) {
      epochGroups[epoch] = { train_acc: [], train_loss: [], steps: [] };
    }
    epochGroups[epoch].train_acc.push({ x: parseInt(key), y: parseFloat(log.train_acc[key]) });
    epochGroups[epoch].train_loss.push({ x: parseInt(key), y: parseFloat(log.train_loss[key]) });
    epochGroups[epoch].steps.push(log.step[key]);
  }

  Object.keys(epochGroups).forEach(epoch => {
    const group = epochGroups[epoch];
    const avgAcc = group.train_acc.reduce((sum, item) => sum + item.y, 0) / group.train_acc.length;
    const avgLoss = group.train_loss.reduce((sum, item) => sum + item.y, 0) / group.train_loss.length;

    results.push({
      epoch: parseInt(epoch),
      totalSteps: group.steps.length,
      avg_accuracy: avgAcc,
      avg_loss: avgLoss,
      train_acc_data: group.train_acc,
      train_loss_data: group.train_loss,
      arch: log.arch
    });
  });

  return results.sort((a, b) => a.epoch - b.epoch);
}

function processRetrainExperimentStatus(data: any) {
  if (!data?.result?.content?.log) return [];

  const log = data.result.content.log;
  const results = [];

  retrainStatus.value = data.result.content.status || 'pending';

  const steps = Object.keys(log.step || {});
  const epochGroups = {};

  for (const key of steps) {
    const epoch = log.epoch[key];
    if (!epochGroups[epoch]) {
      epochGroups[epoch] = { train_acc: [], train_loss: [], steps: [] };
    }
    epochGroups[epoch].train_acc.push({ x: parseInt(key), y: parseFloat(log.train_acc[key]) });
    epochGroups[epoch].train_loss.push({ x: parseInt(key), y: parseFloat(log.train_loss[key]) });
    epochGroups[epoch].steps.push(log.step[key]);
  }

  Object.keys(epochGroups).forEach(epoch => {
    const group = epochGroups[epoch];
    const avgAcc = group.train_acc.reduce((sum, item) => sum + item.y, 0) / group.train_acc.length;
    const avgLoss = group.train_loss.reduce((sum, item) => sum + item.y, 0) / group.train_loss.length;

    results.push({
      epoch: parseInt(epoch),
      totalSteps: group.steps.length,
      avg_accuracy: avgAcc,
      avg_loss: avgLoss,
      train_acc_data: group.train_acc,
      train_loss_data: group.train_loss
    });
  });

  return results.sort((a, b) => a.epoch - b.epoch);
}

function processHPOExperimentStatus(data: any) {
  if (!data?.result?.jobs) return [];

  const jobs = data.result.jobs;
  hpoStatus.value = data.result.status || 'pending';

  return jobs.map(job => ({
    job_id: job.job_id,
    status: job.status,
    start_time: job.start_time,
    end_time: job.end_time,
    parameters: job.parameters,
    final_metric_data: job.final_metric_data,
    metric: job.metric || [],
    duration: job.end_time > 0 ? job.end_time - job.start_time : 0,
    train_acc_data: job.metric ? job.metric.map((value, index) => ({ x: index, y: value })) : []
  }));
}

// API 호출 함수들
async function loadNASExperimentInfo() {
  try {
    const response = await getNASExperimentDetails(expKey.value);
    if (response.code === 130200 && response.result) {
      const data = response.result;

      nasExperimentInfo.value.forEach(item => {
        if (data[item.id] !== undefined) {
          item.value = item.id === 'created_at' ? formatDateTime(data[item.id]) : data[item.id];
        }
      });

      if (data.auto_ml_config) {
        Object.keys(data.auto_ml_config).forEach(key => {
          if (!nasExperimentInfo.value.find(item => item.id === key)) {
            const value = data.auto_ml_config[key];
            nasExperimentInfo.value.push({
              id: key,
              label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: typeof value === 'object' ? JSON.stringify(value, null, 2) : value
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('실험 정보 로드 실패:', error);
  }
}

async function loadNASExperimentStatus() {
  try {
    nasExperimentStatusPending.value = true;
    const response = await getNASExperimentStatus(expKey.value);
    if (response.code === 130200) {
      nasExperimentStatus.value = processNASExperimentStatus(response);
    }
  } catch (error) {
    console.error('NAS 결과 로드 실패:', error);
  } finally {
    nasExperimentStatusPending.value = false;
  }
}

async function loadRetrainExperiments() {
  try {
    retrainExperimentsPending.value = true;
    const response = await getRetrainExperiments(expKey.value);
    if (response.code === 130200 && response.result) {
      retrainExperiments.value = response.result ? response.result.result : [];
    }
  } catch (error) {
    console.error('재학습 실험 로드 실패:', error);
  } finally {
    retrainExperimentsPending.value = false;
  }
}

async function loadRetrainExperimentStatus(retrainExpKey: string) {
  try {
    retrainExperimentStatusPending.value = true;
    const response = await getRetrainExperimentStatus(retrainExpKey);
    if (response.code === 130200) {
      retrainExperimentStatus.value = processRetrainExperimentStatus(response);
    }
  } catch (error) {
    console.error('재학습 결과 로드 실패:', error);
  } finally {
    retrainExperimentStatusPending.value = false;
  }
}

async function loadHPOExperiments() {
  try {
    hpoExperimentsPending.value = true;
    const response = await getHPOExperiments(expKey.value);
    if (response.code === 130200 && response.result) {
      hpoExperiments.value = response.result ? response.result.result : [];
    }
  } catch (error) {
    console.error('하이퍼파라미터 실험 로드 실패:', error);
  } finally {
    hpoExperimentsPending.value = false;
  }
}

async function loadHPOExperimentStatus(hyperparameterExpKey: string) {
  try {
    hpoExperimentStatusPending.value = true;
    const response = await getHPOExperimentStatus(hyperparameterExpKey);
    if (response.code === 130200) {
      hpoExperimentStatus.value = processHPOExperimentStatus(response);
    }
  } catch (error) {
    console.error('하이퍼파라미터 결과 로드 실패:', error);
  } finally {
    hpoExperimentStatusPending.value = false;
  }
}

// 삭제 함수들
async function deleteRetrainExperiment(exp_key: string) {
  if (confirm('delete?')) {
    const response = await removeAutoMLExperiments(exp_key);
    if (response.code == 130200) {
      alert('deleted');
      loadRetrainExperiments();
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result));
    }
  }
}

async function deleteHPOExperiment(exp_key: string) {
  if (confirm('delete?')) {
    const response = await removeAutoMLExperiments(exp_key);
    if (response.code == 130200) {
      alert('deleted');
      loadHPOExperiments();
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result));
    }
  }
}

// 새로고침 함수들
function refreshNASExperimentStatus() {
  loadNASExperimentStatus();
}

function refreshRetrainExperimentStatus() {
  if (selectedRetrainExperiment.value) {
    loadRetrainExperimentStatus(selectedRetrainExperiment.value.exp_key);
  }
}

function refreshHPOExperimentStatus() {
  if (selectedHPOExperiment.value) {
    loadHPOExperimentStatus(selectedHPOExperiment.value.exp_key).then(() => {
      updateHPOExperimentInfo();
    });
  }
}

function refreshAllData() {
  loadNASExperimentInfo();
  loadNASExperimentStatus();
  loadRetrainExperiments();
  loadHPOExperiments();
}

// 검증 함수들
function validateRetrainConfig() {
  const errors = {};

  if (!retrainConfig.value.max_epochs || retrainConfig.value.max_epochs < 1) {
    errors.max_epochs = 'Max Epochs는 1 이상이어야 합니다.';
  }
  if (!retrainConfig.value.batch_size || retrainConfig.value.batch_size < 1) {
    errors.batch_size = 'Batch Size는 1 이상이어야 합니다.';
  }
  if (!retrainConfig.value.learning_rate || retrainConfig.value.learning_rate < 0.0001) {
    errors.learning_rate = 'Learning Rate는 0.0001 이상이어야 합니다.';
  }
  if (retrainConfig.value.momentum < 0 || retrainConfig.value.momentum > 1) {
    errors.momentum = 'Momentum은 0과 1 사이여야 합니다.';
  }
  if (retrainConfig.value.weight_decay < 0) {
    errors.weight_decay = 'Weight Decay는 0 이상이어야 합니다.';
  }
  if (retrainConfig.value.auxiliary_loss_weight < 0 || retrainConfig.value.auxiliary_loss_weight > 1) {
    errors.auxiliary_loss_weight = 'Auxiliary Loss Weight는 0과 1 사이여야 합니다.';
  }
  if (retrainConfig.value.drop_path_prob < 0 || retrainConfig.value.drop_path_prob > 1) {
    errors.drop_path_prob = 'Drop Path Probability는 0과 1 사이여야 합니다.';
  }
  if (!retrainConfig.value.width || retrainConfig.value.width < 4) {
    errors.width = 'Width는 4 이상이어야 합니다.';
  }
  if (!retrainConfig.value.num_cells || retrainConfig.value.num_cells < 3) {
    errors.num_cells = 'Number of Cells는 3 이상이어야 합니다.';
  }

  retrainValidationErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function validateHPOConfig() {
  const errors = {};

  if (!hpoConfig.value.trial_number || hpoConfig.value.trial_number < 1) {
    errors.trial_number = 'Trial Number는 1 이상이어야 합니다.';
  }
  if (hpoConfig.value.trial_number > 1000) {
    errors.trial_number = 'Trial Number는 1000 이하여야 합니다.';
  }

  // Width 검증
  if (hpoConfig.value.width_type === 'choice') {
    const choices = hpoConfig.value.width_choices.split(',').map(v => parseInt(v.trim()));
    if (choices.some(choice => choice < 4)) {
      errors.width_choices = 'Width 선택값은 모두 4 이상이어야 합니다.';
    }
  } else {
    if (hpoConfig.value.width_min < 4) {
      errors.width_min = 'Width 최소값은 4 이상이어야 합니다.';
    }
    if (hpoConfig.value.width_max < 4) {
      errors.width_max = 'Width 최대값은 4 이상이어야 합니다.';
    }
  }

  // Num Cells 검증
  if (hpoConfig.value.num_cells_type === 'choice') {
    const choices = hpoConfig.value.num_cells_choices.split(',').map(v => parseInt(v.trim()));
    if (choices.some(choice => choice < 3)) {
      errors.num_cells_choices = 'Num Cells 선택값은 모두 3 이상이어야 합니다.';
    }
  } else {
    if (hpoConfig.value.num_cells_min < 3) {
      errors.num_cells_min = 'Num Cells 최소값은 3 이상이어야 합니다.';
    }
    if (hpoConfig.value.num_cells_max < 3) {
      errors.num_cells_max = 'Num Cells 최대값은 3 이상이어야 합니다.';
    }
  }

  hpoValidationErrors.value = errors;
  return Object.keys(errors).length === 0;
}

// 제출 함수들
async function submitRetrain() {
  if (!validateRetrainConfig()) return;

  try {
    submittingRetrain.value = true;

    const datasetInfo = nasExperimentInfo.value.find(item => item.id === 'dataset_name');
    const datasetName = datasetInfo?.value || 'beans';

    const config = {
      ...retrainConfig.value,
      dataset_name: datasetName,
      nas_exp: expKey.value
    };

    const response = await startRetrain(config);

    if (response.code === 130200) {
      closeRetrainModal();
      retrainValidationErrors.value = {};
      await loadRetrainExperiments();
    } else {
      alert(`오류[${response.code}]: ${response.message}`);
    }
  } catch (error) {
    console.error('재학습 시작 실패:', error);
    alert('재학습 시작 중 오류가 발생했습니다.');
  } finally {
    submittingRetrain.value = false;
  }
}

function buildSearchSpace() {
  const config = hpoConfig.value;
  const searchSpace = {};

  const buildParam = (type, choices, min, max) => {
    if (type === 'choice') {
      const values = choices.split(',').map(v => {
        const trimmed = v.trim();
        return isNaN(trimmed) ? trimmed : parseFloat(trimmed);
      });
      return { _type: 'choice', _value: values };
    } else {
      return { _type: type, _value: [min, max] };
    }
  };

  searchSpace.max_epochs = buildParam(config.max_epochs_type, config.max_epochs_choices, config.max_epochs_min, config.max_epochs_max);
  searchSpace.batch_size = buildParam(config.batch_size_type, config.batch_size_choices, config.batch_size_min, config.batch_size_max);
  searchSpace.learning_rate = buildParam(config.learning_rate_type, config.learning_rate_choices, config.learning_rate_min, config.learning_rate_max);
  searchSpace.momentum = buildParam(config.momentum_type, config.momentum_choices, config.momentum_min, config.momentum_max);
  searchSpace.weight_decay = buildParam(config.weight_decay_type, config.weight_decay_choices, config.weight_decay_min, config.weight_decay_max);
  searchSpace.auxiliary_loss_weight = buildParam(config.auxiliary_loss_weight_type, config.auxiliary_loss_weight_choices, config.auxiliary_loss_weight_min, config.auxiliary_loss_weight_max);
  searchSpace.width = buildParam(config.width_type, config.width_choices, config.width_min, config.width_max);
  searchSpace.num_cells = buildParam(config.num_cells_type, config.num_cells_choices, config.num_cells_min, config.num_cells_max);
  searchSpace.drop_path_prob = buildParam(config.drop_path_prob_type, config.drop_path_prob_choices, config.drop_path_prob_min, config.drop_path_prob_max);

  return searchSpace;
}

async function submitHPO() {
  if (!validateHPOConfig()) return;

  try {
    submittingHPO.value = true;

    const datasetInfo = nasExperimentInfo.value.find(item => item.id === 'dataset_name');
    const datasetName = datasetInfo?.value || 'beans';

    const requestData = {
      dataset_name: datasetName,
      nas_exp: expKey.value,
      tuner: hpoConfig.value.tuner,
      trial_number: hpoConfig.value.trial_number,
      search_space: buildSearchSpace()
    };

    const response = await startHPO(requestData);

    if (response.code === 130200) {
      closeHyperparameterModal();
      hpoValidationErrors.value = {};
      await loadHPOExperiments();
    } else {
      alert(`오류[${response.code}]: ${response.message}`);
    }
  } catch (error) {
    console.error('하이퍼파라미터 최적화 시작 실패:', error);
    alert('하이퍼파라미터 최적화 시작 중 오류가 발생했습니다.');
  } finally {
    submittingHPO.value = false;
  }
}

// 모달 상태 관리
watch(showRetrainModal, (newValue) => {
  if (newValue) {
    retrainValidationErrors.value = {};
  }
});

watch(showHyperparameterModal, (newValue) => {
  if (newValue) {
    hpoValidationErrors.value = {};
  }
});

// 라이프사이클
onMounted(() => {
  loadNASExperimentInfo();
  loadNASExperimentStatus();
  loadRetrainExperiments();
  loadHPOExperiments();
});
</script>

<style scoped>
/* 기존 스타일 + 에러 상태 스타일 */
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 반응형 그리드 */
@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  .grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 애니메이션 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 숫자 입력 스타일 */
input[type="number"] {
  -moz-appearance: textfield;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>