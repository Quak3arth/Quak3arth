<template>
  <v-app v-cloak>
    <v-app-bar
      app
      dark
    >
      <v-app-bar-title>地震可视化分析</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn
        href="https://github.com/Quak3arth"
        target="_blank"
        text
      >
        <span>Github Project</span>
        <v-icon>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer
      app
    >
      <v-card
        style="display: grid; gap: 8px;padding: 8px;"
        hover
      >
        <v-switch
          v-model="freeze"
          label="聚焦模式"
        >
        </v-switch>
      </v-card>
      <v-card
        hover
        style="display: grid; gap: 8px;padding: 8px;"
      >
        <v-card-subtitle>日期选择</v-card-subtitle>
        <v-menu
          ref="startmenu"
          v-model="startMenu"
          transition="scale-transition"
          offset-y
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="startDate"
              label="开始日期"
              prepend-icon="mdi-calendar-month"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="startDate"
            locale="zh-cn"
            min="2000-01-01"
            max="2021-10-31"
            no-title
            scrollable
          >
          </v-date-picker>
        </v-menu>
        <v-menu
          ref="endmenu"
          v-model="endMenu"
          transition="scale-transition"
          offset-y
          full-width
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="endDate"
              label="结束日期"
              prepend-icon="mdi-calendar-month"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="endDate"
            locale="zh-cn"
            :min="minEndDate"
            :max="maxEndDate"
            no-title
            scrollable
          >
          </v-date-picker>
        </v-menu>
      </v-card>
      <v-card
        style="display: grid; gap: 8px;padding: 8px;"
        hover
      >
        <v-card-subtitle>
          震级范围选择
        </v-card-subtitle>
        <v-range-slider
          v-model="magnitudeRange"
          :min="4.5"
          :max="10"
          thumb-label
          prepend-icon="mdi-minus"
          append-icon="mdi-plus"
          step="0.1"
        ></v-range-slider>
      </v-card>
      <v-btn
        block
        color="primary"
        @click="startRender"
      >让我康康</v-btn>
    </v-navigation-drawer>
    <v-main>
      <v-container fill-height overflow-hidden>
        <earth-map
          :earthquake-array="selectedEarthquakes"
          :freeze="freeze"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>

import EarthMap from '@/components/EarthMap'
import { getEarthquakeByDateAndMag } from '@/plugins/utils'
export default {
  name: 'App',
  components: { EarthMap },
  watch: {
    startDate (newValue) {
      const startdate = new Date(newValue)
      const enddate = new Date(this.endDate)
      if (startdate > enddate) {
        enddate.setDate(startdate.getDate() + 90)
        this.endDate = enddate.toISOString().substr(0, 10)
      }
    }
  },
  data: () => ({
    startDate: '2000-01-01',
    startMenu: false,
    endDate: '2000-03-01',
    endMenu: false,
    minMenu: false,
    maxMenu: false,
    magnitudeRange: [4.5, 9],
    selectedEarthquakes: [],
    freeze: false
  }),
  computed: {
    minEndDate: function () {
      return this.startDate
    },
    maxEndDate: function () {
      const startdate = new Date(this.startDate)
      const enddate = new Date(startdate)
      enddate.setDate(startdate.getDate() + 90)
      return enddate.toISOString().substr(0, 10)
    }
  },

  methods: {
    startRender () {
      this.selectedEarthquakes = getEarthquakeByDateAndMag(this.startDate, this.endDate, this.magnitudeRange[0], this.magnitudeRange[1])
    }
  }
}
</script>
