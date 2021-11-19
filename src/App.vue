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
    <v-main>
      <v-container fill-height overflow-hidden>
        <router-view/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    //
  })
}
</script>
