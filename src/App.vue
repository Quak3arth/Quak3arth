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
    <v-navigation-drawer app>
      <v-card>
        <v-subheader>日期选择</v-subheader>
        <v-menu
          ref="startmenu"
          v-model="startMenu"
          :close-on-content-click="false"
          :return-value.sync="startDate"
          transition="scale-transition"
          offset-y
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="startDate"
              label="开始月份"
              prepend-icon="mdi-calendar-month"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="startDate"
            type="month"
            locale="zh-cn"
            min="2000-01"
            max="2021-10"
            no-title
            scrollable
          >
            <v-spacer></v-spacer>
            <v-btn text color="primary" @click="startMenu = false">取消</v-btn>
            <v-btn text color="primary" @click="$refs.startmenu.save(startDate)">确定</v-btn>
          </v-date-picker>
        </v-menu>
        <v-menu
          ref="endmenu"
          v-model="endMenu"
          :close-on-content-click="false"
          :return-value.sync="endDate"
          transition="scale-transition"
          offset-y
          full-width
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="endDate"
              label="结束月份"
              prepend-icon="mdi-calendar-month"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="endDate"
            type="month"
            locale="zh-cn"
            :min="startDate"
            max="2021-10"
            no-title
            scrollable
          >
            <v-spacer></v-spacer>
            <v-btn text color="primary" @click="endMenu = false">取消</v-btn>
            <v-btn text color="primary" @click="$refs.endmenu.save(endDate)">确定</v-btn>
          </v-date-picker>
        </v-menu>
      </v-card>
    </v-navigation-drawer>
    <v-main>
      <v-container fill-height overflow-hidden>
        <earth-map/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>

import EarthMap from '@/components/EarthMap'
export default {
  name: 'App',
  components: { EarthMap },
  watch: {
    startDate (newValue) {
      if (new Date(newValue) > new Date(this.endDate)) {
        this.endDate = newValue
      }
    }
  },
  data: () => ({
    startDate: '2000-01',
    startMenu: false,
    endDate: '2000-01',
    endMenu: false
  }),
  computed: {

  },

  methods: {
  }
}
</script>
