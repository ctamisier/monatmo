<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from './stores/auth.store'
import ConfigCard from './components/ConfigCard.vue'
import AuthCard from './components/AuthCard.vue'
import TokenCard from './components/TokenCard.vue'
import HomeCard from './components/HomeCard.vue'
import TemperatureCard from './components/TemperatureCard.vue'
import ShutterCard from './components/ShutterCard.vue'
import LightCard from './components/LightCard.vue'
import ToastNotification from './components/ToastNotification.vue'

const auth = useAuthStore()
const { t } = useI18n()
const successMessage = ref('')

onMounted(async () => {
  try {
    const result = await auth.processCallback()
    if (result) {
      successMessage.value = t('app.success')
      setTimeout(() => { successMessage.value = '' }, 3000)
    }
  } catch (e) {
    console.error('Callback error:', e)
  }
  auth.checkExistingToken()
})
</script>

<template>
  <div class="min-h-screen max-w-350 mx-auto p-5 sm:p-6 relative">
    <div class="stars-small" />
    <div class="stars-medium" />
    <div class="stars-large" />

    <div class="flex flex-wrap gap-5 relative z-10">
      <div class="flex-1 min-w-100 max-sm:min-w-full">
        <ConfigCard />
      </div>
      <div class="flex-1 min-w-100 max-sm:min-w-full">
        <AuthCard v-if="!auth.isAuthenticated" />
        <TokenCard v-else />
      </div>
    </div>

    <div
      v-if="auth.isAuthenticated"
      class="relative z-10 mt-5"
    >
      <HomeCard />
    </div>

    <div
      v-if="auth.isAuthenticated"
      class="relative z-10 mt-5"
    >
      <TemperatureCard />
    </div>

    <div
      v-if="auth.isAuthenticated"
      class="relative z-10 mt-5"
    >
      <LightCard />
    </div>

    <div
      v-if="auth.isAuthenticated"
      class="relative z-10 mt-5"
    >
      <ShutterCard />
    </div>
  </div>

  <ToastNotification
    v-if="successMessage"
    :key="successMessage"
    :message="successMessage"
    type="success"
  />
</template>

<style scoped>
.stars-small,
.stars-medium,
.stars-large {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
  will-change: opacity;
}

.stars-small {
  width: 1px;
  height: 1px;
  background: transparent;
  animation: twinkle-slow 8s ease-in-out infinite;
  box-shadow:
    47px 182px rgba(244,132,95,0.18), 312px 74px rgba(244,132,95,0.14), 89px 761px rgba(244,132,95,0.11),
    541px 615px rgba(244,132,95,0.10), 228px 912px rgba(244,132,95,0.15), 345px 501px rgba(244,132,95,0.13),
    133px 453px rgba(244,132,95,0.26), 56px 391px rgba(244,132,95,0.25), 178px 624px rgba(244,132,95,0.29),
    392px 67px rgba(244,132,95,0.38), 68px 886px rgba(244,132,95,0.42), 213px 198px rgba(244,132,95,0.40),
    92px 547px rgba(224,82,151,0.25), 254px 732px rgba(224,82,151,0.19), 363px 412px rgba(123,94,167,0.15),
    89px 678px rgba(123,94,167,0.13), 278px 567px rgba(244,132,95,0.17), 112px 243px rgba(244,132,95,0.18),
    234px 134px rgba(244,132,95,0.25), 456px 234px rgba(244,132,95,0.18), 321px 456px rgba(244,132,95,0.23),
    123px 345px rgba(244,132,95,0.24), 189px 456px rgba(244,132,95,0.22), 423px 912px rgba(244,132,95,0.15),
    672px 344px rgba(244,132,95,0.13), 893px 521px rgba(244,132,95,0.12), 756px 132px rgba(244,132,95,0.17),
    614px 820px rgba(244,132,95,0.11), 789px 289px rgba(244,132,95,0.24), 467px 718px rgba(244,132,95,0.28),
    834px 47px rgba(244,132,95,0.27), 623px 951px rgba(244,132,95,0.22), 503px 173px rgba(244,132,95,0.24),
    741px 509px rgba(244,132,95,0.27), 845px 712px rgba(244,132,95,0.35), 574px 431px rgba(244,132,95,0.39),
    930px 102px rgba(244,132,95,0.34), 319px 647px rgba(244,132,95,0.36), 701px 263px rgba(244,132,95,0.38),
    637px 483px rgba(224,82,151,0.18), 815px 154px rgba(224,82,151,0.23), 731px 234px rgba(123,94,167,0.18),
    502px 127px rgba(123,94,167,0.16), 813px 789px rgba(244,132,95,0.23), 657px 678px rgba(244,132,95,0.21),
    567px 321px rgba(244,132,95,0.22), 789px 890px rgba(244,132,95,0.13), 678px 789px rgba(244,132,95,0.15),
    567px 123px rgba(244,132,95,0.21), 890px 345px rgba(244,132,95,0.14), 145px 789px rgba(244,132,95,0.19),
    678px 567px rgba(244,132,95,0.22), 456px 678px rgba(244,132,95,0.20), 789px 456px rgba(244,132,95,0.15),
    567px 890px rgba(244,132,95,0.12), 890px 123px rgba(244,132,95,0.19), 678px 234px rgba(244,132,95,0.18),
    1023px 267px rgba(244,132,95,0.12), 1180px 692px rgba(244,132,95,0.10), 1204px 88px rgba(244,132,95,0.16),
    1358px 430px rgba(244,132,95,0.19), 1290px 155px rgba(244,132,95,0.22), 1102px 573px rgba(244,132,95,0.21),
    987px 416px rgba(244,132,95,0.20), 1345px 238px rgba(244,132,95,0.26), 1067px 782px rgba(244,132,95,0.21),
    1156px 334px rgba(244,132,95,0.36), 1389px 559px rgba(244,132,95,0.37), 918px 38px rgba(244,132,95,0.16),
    1237px 875px rgba(244,132,95,0.41), 1078px 489px rgba(244,132,95,0.33), 876px 594px rgba(244,132,95,0.35),
    1301px 92px rgba(224,82,151,0.22), 1142px 371px rgba(224,82,151,0.20), 1067px 628px rgba(224,82,151,0.21),
    1198px 589px rgba(123,94,167,0.12), 947px 843px rgba(123,94,167,0.11), 1047px 321px rgba(244,132,95,0.20),
    1389px 145px rgba(244,132,95,0.19), 1234px 456px rgba(244,132,95,0.14), 945px 678px rgba(244,132,95,0.16),
    1123px 567px rgba(244,132,95,0.20), 1290px 678px rgba(244,132,95,0.17), 1023px 234px rgba(244,132,95,0.16),
    1167px 123px rgba(244,132,95,0.13), 1345px 789px rgba(244,132,95,0.17), 1234px 567px rgba(244,132,95,0.16),
    1056px 890px rgba(244,132,95,0.17), 912px 678px rgba(244,132,95,0.14), 1023px 456px rgba(244,132,95,0.19),
    1456px 182px rgba(244,132,95,0.18), 1612px 74px rgba(244,132,95,0.15), 1793px 521px rgba(244,132,95,0.12),
    1504px 388px rgba(244,132,95,0.16), 1872px 144px rgba(244,132,95,0.13), 1689px 761px rgba(244,132,95,0.11),
    1558px 430px rgba(244,132,95,0.19), 1741px 615px rgba(244,132,95,0.10), 1428px 912px rgba(244,132,95,0.15),
    1623px 267px rgba(244,132,95,0.12), 1856px 132px rgba(244,132,95,0.17), 1480px 692px rgba(244,132,95,0.10),
    1745px 501px rgba(244,132,95,0.13), 1918px 38px rgba(244,132,95,0.16), 1614px 820px rgba(244,132,95,0.11),
    1533px 453px rgba(244,132,95,0.26), 1789px 289px rgba(244,132,95,0.24), 1690px 155px rgba(244,132,95,0.22),
    1467px 718px rgba(244,132,95,0.28), 1556px 391px rgba(244,132,95,0.25), 1902px 573px rgba(244,132,95,0.21),
    1834px 47px rgba(244,132,95,0.27), 1671px 839px rgba(244,132,95,0.23), 1487px 416px rgba(244,132,95,0.20),
    1745px 238px rgba(244,132,95,0.26), 1823px 951px rgba(244,132,95,0.22), 1478px 624px rgba(244,132,95,0.29),
    1603px 173px rgba(244,132,95,0.24), 1867px 782px rgba(244,132,95,0.21), 1741px 509px rgba(244,132,95,0.27),
    1592px 67px rgba(244,132,95,0.38), 1456px 334px rgba(244,132,95,0.36), 1768px 886px rgba(244,132,95,0.42),
    1845px 712px rgba(244,132,95,0.35), 1613px 198px rgba(244,132,95,0.40), 1889px 559px rgba(244,132,95,0.37),
    1574px 431px rgba(244,132,95,0.39), 1730px 102px rgba(244,132,95,0.34), 1537px 875px rgba(244,132,95,0.41),
    1619px 647px rgba(244,132,95,0.36), 1801px 263px rgba(244,132,95,0.38), 1478px 489px rgba(244,132,95,0.33),
    1758px 328px rgba(244,132,95,0.43), 1876px 594px rgba(244,132,95,0.35), 1647px 756px rgba(244,132,95,0.40),
    1501px 92px rgba(224,82,151,0.22), 1637px 483px rgba(224,82,151,0.18), 1892px 547px rgba(224,82,151,0.25),
    1542px 371px rgba(224,82,151,0.20), 1678px 817px rgba(224,82,151,0.16), 1815px 154px rgba(224,82,151,0.23),
    1754px 732px rgba(224,82,151,0.19), 1667px 628px rgba(224,82,151,0.21), 1489px 43px rgba(224,82,151,0.17),
    1563px 412px rgba(123,94,167,0.15), 1698px 589px rgba(123,94,167,0.12), 1831px 234px rgba(123,94,167,0.18),
    1489px 678px rgba(123,94,167,0.13), 1747px 843px rgba(123,94,167,0.11), 1602px 127px rgba(123,94,167,0.16),
    1947px 321px rgba(244,132,95,0.18), 2112px 74px rgba(244,132,95,0.14), 2293px 521px rgba(244,132,95,0.12),
    2004px 88px rgba(244,132,95,0.16), 2172px 344px rgba(244,132,95,0.13), 1989px 761px rgba(244,132,95,0.11),
    2358px 430px rgba(244,132,95,0.19), 2141px 615px rgba(244,132,95,0.10), 2028px 912px rgba(244,132,95,0.15),
    2223px 267px rgba(244,132,95,0.12), 2056px 132px rgba(244,132,95,0.17), 2380px 692px rgba(244,132,95,0.10),
    2145px 501px rgba(244,132,95,0.13), 2418px 38px rgba(244,132,95,0.16), 2214px 820px rgba(244,132,95,0.11),
    1933px 453px rgba(244,132,95,0.26), 2089px 289px rgba(244,132,95,0.24), 2290px 155px rgba(244,132,95,0.22),
    2067px 718px rgba(244,132,95,0.28), 1956px 391px rgba(244,132,95,0.25), 2402px 573px rgba(244,132,95,0.21),
    2134px 47px rgba(244,132,95,0.27), 2071px 839px rgba(244,132,95,0.23), 2487px 416px rgba(244,132,95,0.20),
    2345px 238px rgba(244,132,95,0.26), 2023px 951px rgba(244,132,95,0.22), 2178px 624px rgba(244,132,95,0.29),
    2003px 173px rgba(244,132,95,0.24), 2467px 782px rgba(244,132,95,0.21), 2241px 509px rgba(244,132,95,0.27),
    1992px 67px rgba(244,132,95,0.38), 2256px 334px rgba(244,132,95,0.36), 2068px 886px rgba(244,132,95,0.42),
    2445px 712px rgba(244,132,95,0.35), 2113px 198px rgba(244,132,95,0.40), 2389px 559px rgba(244,132,95,0.37),
    2174px 431px rgba(244,132,95,0.39), 2330px 102px rgba(244,132,95,0.34), 2037px 875px rgba(244,132,95,0.41),
    2219px 647px rgba(244,132,95,0.36), 2401px 263px rgba(244,132,95,0.38), 2178px 489px rgba(244,132,95,0.33),
    2058px 328px rgba(244,132,95,0.43), 2476px 594px rgba(244,132,95,0.35), 2347px 756px rgba(244,132,95,0.40),
    1901px 92px rgba(224,82,151,0.22), 2137px 483px rgba(224,82,151,0.18), 2492px 547px rgba(224,82,151,0.25),
    2042px 371px rgba(224,82,151,0.20), 2378px 817px rgba(224,82,151,0.16), 2215px 154px rgba(224,82,151,0.23),
    2154px 732px rgba(224,82,151,0.19), 2467px 628px rgba(224,82,151,0.21), 1989px 43px rgba(224,82,151,0.17),
    2063px 412px rgba(123,94,167,0.15), 2298px 589px rgba(123,94,167,0.12), 2431px 234px rgba(123,94,167,0.18),
    1989px 678px rgba(123,94,167,0.13), 2347px 843px rgba(123,94,167,0.11), 2102px 127px rgba(123,94,167,0.16);
}

.stars-medium {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  animation: twinkle-medium 5s ease-in-out infinite;
  box-shadow:
    247px 382px rgba(244,132,95,0.45), 412px 174px rgba(244,132,95,0.42), 193px 621px rgba(244,132,95,0.48),
    404px 888px rgba(244,132,95,0.44), 272px 44px rgba(244,132,95,0.46), 89px 261px rgba(244,132,95,0.40),
    358px 561px rgba(244,132,95,0.43), 141px 712px rgba(244,132,95,0.47), 528px 315px rgba(244,132,95,0.41),
    323px 138px rgba(244,132,95,0.45), 156px 832px rgba(244,132,95,0.43), 480px 492px rgba(244,132,95,0.42),
    345px 201px rgba(244,132,95,0.60), 218px 438px rgba(244,132,95,0.58), 414px 720px rgba(244,132,95,0.62),
    141px 88px rgba(244,132,95,0.55), 467px 618px rgba(244,132,95,0.61), 56px 289px rgba(244,132,95,0.57),
    333px 753px rgba(244,132,95,0.63), 189px 459px rgba(244,132,95,0.56), 434px 147px rgba(244,132,95,0.60),
    271px 839px rgba(244,132,95,0.58), 87px 516px rgba(244,132,95,0.54), 445px 278px rgba(244,132,95,0.62),
    123px 451px rgba(160,210,255,0.55), 378px 334px rgba(160,210,255,0.50), 268px 886px rgba(160,210,255,0.58),
    445px 712px rgba(160,210,255,0.48), 192px 167px rgba(160,210,255,0.53), 89px 559px rgba(160,210,255,0.51),
    374px 431px rgba(255,230,160,0.48), 130px 202px rgba(255,230,160,0.52), 237px 647px rgba(255,230,160,0.45),
    301px 892px rgba(255,230,160,0.50), 501px 363px rgba(255,230,160,0.47), 78px 589px rgba(255,230,160,0.53),
    812px 174px rgba(244,132,95,0.42), 1193px 621px rgba(244,132,95,0.48), 1089px 261px rgba(244,132,95,0.40),
    841px 712px rgba(244,132,95,0.47), 1323px 138px rgba(244,132,95,0.45), 756px 832px rgba(244,132,95,0.43),
    1080px 492px rgba(244,132,95,0.42), 918px 438px rgba(244,132,95,0.58), 614px 720px rgba(244,132,95,0.62),
    1241px 88px rgba(244,132,95,0.55), 756px 289px rgba(244,132,95,0.57), 1389px 459px rgba(244,132,95,0.56),
    834px 147px rgba(244,132,95,0.60), 987px 516px rgba(244,132,95,0.54), 1145px 278px rgba(244,132,95,0.62),
    623px 451px rgba(160,210,255,0.55), 1178px 334px rgba(160,210,255,0.50), 845px 712px rgba(160,210,255,0.48),
    1001px 167px rgba(160,210,255,0.53), 1089px 559px rgba(160,210,255,0.51), 701px 363px rgba(255,230,160,0.47),
    1078px 589px rgba(255,230,160,0.53), 874px 431px rgba(255,230,160,0.48), 1030px 202px rgba(255,230,160,0.52),
    158px 128px rgba(244,132,95,0.70), 876px 594px rgba(244,132,95,0.68), 447px 956px rgba(244,132,95,0.72),
    1023px 371px rgba(244,132,95,0.65), 637px 683px rgba(244,132,95,0.71), 1142px 571px rgba(244,132,95,0.66),
    478px 817px rgba(244,132,95,0.73), 815px 54px rgba(244,132,95,0.67), 354px 512px rgba(244,132,95,0.50),
    1167px 223px rgba(244,132,95,0.47), 589px 743px rgba(244,132,95,0.53), 912px 378px rgba(244,132,95,0.44),
    1245px 712px rgba(244,132,95,0.51), 723px 134px rgba(244,132,95,0.52), 278px 467px rgba(244,132,95,0.48),
    1456px 382px rgba(244,132,95,0.45), 1712px 174px rgba(244,132,95,0.42), 1593px 621px rgba(244,132,95,0.48),
    1804px 888px rgba(244,132,95,0.44), 1572px 44px rgba(244,132,95,0.46), 1489px 261px rgba(244,132,95,0.40),
    1658px 561px rgba(244,132,95,0.43), 1841px 712px rgba(244,132,95,0.47), 1528px 315px rgba(244,132,95,0.41),
    1723px 138px rgba(244,132,95,0.45), 1456px 832px rgba(244,132,95,0.43), 1880px 492px rgba(244,132,95,0.42),
    1545px 201px rgba(244,132,95,0.60), 1818px 438px rgba(244,132,95,0.58), 1614px 720px rgba(244,132,95,0.62),
    1741px 88px rgba(244,132,95,0.55), 1467px 618px rgba(244,132,95,0.61), 1756px 289px rgba(244,132,95,0.57),
    1533px 753px rgba(244,132,95,0.63), 1889px 459px rgba(244,132,95,0.56), 1634px 147px rgba(244,132,95,0.60),
    1671px 839px rgba(244,132,95,0.58), 1787px 516px rgba(244,132,95,0.54), 1545px 278px rgba(244,132,95,0.62),
    1623px 451px rgba(160,210,255,0.55), 1878px 334px rgba(160,210,255,0.50), 1468px 886px rgba(160,210,255,0.58),
    1845px 712px rgba(160,210,255,0.48), 1492px 167px rgba(160,210,255,0.53), 1789px 559px rgba(160,210,255,0.51),
    1574px 431px rgba(255,230,160,0.48), 1730px 202px rgba(255,230,160,0.52), 1637px 647px rgba(255,230,160,0.45),
    1901px 892px rgba(255,230,160,0.50), 1601px 363px rgba(255,230,160,0.47), 1478px 589px rgba(255,230,160,0.53),
    1558px 128px rgba(244,132,95,0.70), 1876px 594px rgba(244,132,95,0.68), 1647px 956px rgba(244,132,95,0.72),
    1823px 371px rgba(244,132,95,0.65), 1537px 683px rgba(244,132,95,0.71), 1742px 571px rgba(244,132,95,0.66),
    1678px 817px rgba(244,132,95,0.73), 1915px 54px rgba(244,132,95,0.67), 1554px 512px rgba(244,132,95,0.50),
    1867px 223px rgba(244,132,95,0.47), 1589px 743px rgba(244,132,95,0.53), 1712px 378px rgba(244,132,95,0.44),
    1947px 382px rgba(244,132,95,0.45), 2112px 174px rgba(244,132,95,0.42), 2293px 621px rgba(244,132,95,0.48),
    2004px 888px rgba(244,132,95,0.44), 2172px 44px rgba(244,132,95,0.46), 1989px 261px rgba(244,132,95,0.40),
    2158px 561px rgba(244,132,95,0.43), 2441px 712px rgba(244,132,95,0.47), 2028px 315px rgba(244,132,95,0.41),
    2323px 138px rgba(244,132,95,0.45), 2056px 832px rgba(244,132,95,0.43), 2380px 492px rgba(244,132,95,0.42),
    2045px 201px rgba(244,132,95,0.60), 2418px 438px rgba(244,132,95,0.58), 2214px 720px rgba(244,132,95,0.62),
    2141px 88px rgba(244,132,95,0.55), 1967px 618px rgba(244,132,95,0.61), 2356px 289px rgba(244,132,95,0.57),
    2033px 753px rgba(244,132,95,0.63), 2489px 459px rgba(244,132,95,0.56), 2134px 147px rgba(244,132,95,0.60),
    2271px 839px rgba(244,132,95,0.58), 2087px 516px rgba(244,132,95,0.54), 2445px 278px rgba(244,132,95,0.62),
    2023px 451px rgba(160,210,255,0.55), 2378px 334px rgba(160,210,255,0.50), 2168px 886px rgba(160,210,255,0.58),
    2445px 712px rgba(160,210,255,0.48), 2192px 167px rgba(160,210,255,0.53), 2089px 559px rgba(160,210,255,0.51),
    2174px 431px rgba(255,230,160,0.48), 2330px 202px rgba(255,230,160,0.52), 2037px 647px rgba(255,230,160,0.45),
    2401px 892px rgba(255,230,160,0.50), 2101px 363px rgba(255,230,160,0.47), 2478px 589px rgba(255,230,160,0.53),
    2058px 128px rgba(244,132,95,0.70), 2476px 594px rgba(244,132,95,0.68), 2347px 956px rgba(244,132,95,0.72),
    2223px 371px rgba(244,132,95,0.65), 2037px 683px rgba(244,132,95,0.71), 2342px 571px rgba(244,132,95,0.66),
    2478px 817px rgba(244,132,95,0.73), 2115px 54px rgba(244,132,95,0.67), 2254px 512px rgba(244,132,95,0.50),
    2467px 223px rgba(244,132,95,0.47), 2189px 743px rgba(244,132,95,0.53), 2312px 378px rgba(244,132,95,0.44);
}

.stars-large {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  animation: twinkle-fast 3s ease-in-out infinite;
  box-shadow:
    247px 182px rgba(244,132,95,0.82), 412px 574px rgba(244,132,95,0.90),
    193px 321px rgba(244,132,95,0.78), 404px 888px rgba(244,132,95,0.85),
    72px 144px rgba(244,132,95,0.88), 289px 661px rgba(244,132,95,0.80),
    158px 461px rgba(244,132,95,0.86), 341px 812px rgba(244,132,95,0.92),
    528px 215px rgba(244,132,95,0.79), 423px 538px rgba(244,132,95,0.84),
    756px 932px rgba(244,132,95,0.87), 680px 92px rgba(244,132,95,0.81),
    845px 601px rgba(224,82,151,0.88), 618px 238px rgba(224,82,151,0.82),
    914px 720px rgba(224,82,151,0.90), 641px 488px rgba(224,82,151,0.85),
    667px 318px rgba(123,94,167,0.86), 756px 789px rgba(123,94,167,0.82),
    833px 153px rgba(123,94,167,0.90), 589px 259px rgba(123,94,167,0.84),
    834px 447px rgba(244,132,95,0.95), 971px 739px rgba(244,132,95,0.92),
    1123px 321px rgba(244,132,95,0.78), 1080px 92px rgba(244,132,95,0.81),
    1323px 538px rgba(244,132,95,0.84), 1193px 875px rgba(244,132,95,0.87),
    1041px 488px rgba(224,82,151,0.85), 1345px 601px rgba(224,82,151,0.88),
    1189px 259px rgba(123,94,167,0.84), 1289px 116px rgba(244,132,95,0.88),
    1245px 678px rgba(244,132,95,0.94), 1023px 851px rgba(244,132,95,0.90),
    987px 116px rgba(244,132,95,0.88), 1145px 678px rgba(244,132,95,0.94),
    623px 851px rgba(244,132,95,0.90),
    1547px 182px rgba(244,132,95,0.82), 1712px 574px rgba(244,132,95,0.90),
    1493px 321px rgba(244,132,95,0.78), 1804px 888px rgba(244,132,95,0.85),
    1672px 144px rgba(244,132,95,0.88), 1889px 661px rgba(244,132,95,0.80),
    1458px 461px rgba(244,132,95,0.86), 1741px 812px rgba(244,132,95,0.92),
    1628px 215px rgba(244,132,95,0.79), 1823px 538px rgba(244,132,95,0.84),
    1856px 932px rgba(244,132,95,0.87), 1480px 92px rgba(244,132,95,0.81),
    1545px 601px rgba(224,82,151,0.88), 1818px 238px rgba(224,82,151,0.82),
    1614px 720px rgba(224,82,151,0.90), 1741px 488px rgba(224,82,151,0.85),
    1667px 318px rgba(123,94,167,0.86), 1856px 789px rgba(123,94,167,0.82),
    1433px 153px rgba(123,94,167,0.90), 1789px 259px rgba(123,94,167,0.84),
    1834px 447px rgba(244,132,95,0.95), 1571px 739px rgba(244,132,95,0.92),
    1687px 116px rgba(244,132,95,0.88), 1545px 678px rgba(244,132,95,0.94),
    1947px 182px rgba(244,132,95,0.82), 2112px 574px rgba(244,132,95,0.90),
    2293px 321px rgba(244,132,95,0.78), 2004px 888px rgba(244,132,95,0.85),
    2172px 144px rgba(244,132,95,0.88), 2389px 661px rgba(244,132,95,0.80),
    1958px 461px rgba(244,132,95,0.86), 2241px 812px rgba(244,132,95,0.92),
    2128px 215px rgba(244,132,95,0.79), 2323px 538px rgba(244,132,95,0.84),
    2056px 932px rgba(244,132,95,0.87), 2480px 92px rgba(244,132,95,0.81),
    2045px 601px rgba(224,82,151,0.88), 2418px 238px rgba(224,82,151,0.82),
    2214px 720px rgba(224,82,151,0.90), 2341px 488px rgba(224,82,151,0.85),
    2167px 318px rgba(123,94,167,0.86), 2456px 789px rgba(123,94,167,0.82),
    2033px 153px rgba(123,94,167,0.90), 2289px 259px rgba(123,94,167,0.84),
    2134px 447px rgba(244,132,95,0.95), 2471px 739px rgba(244,132,95,0.92),
    2387px 116px rgba(244,132,95,0.88), 2245px 678px rgba(244,132,95,0.94),
    2023px 851px rgba(244,132,95,0.90);
}

@keyframes twinkle-slow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@keyframes twinkle-medium {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.9; }
}

@keyframes twinkle-fast {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
