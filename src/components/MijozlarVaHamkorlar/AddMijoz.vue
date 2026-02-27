<template>
  <div class="container">
    <div class="header-row">
      <el-icon @click="goback()"><Back /></el-icon>
      <h2>{{ $t('yangiMijozQoshishText') }}</h2>
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" class="form">
      <!-- ISM FAMILIYA -->
      <el-form-item :label="$t('ismFamiliya')" prop="fullname" required>
        <el-input v-model="form.fullname" :placeholder="$t('kiriting')" class="full-width-input" />
      </el-form-item>

      <!-- MIJOZ TURI -->
      <el-form-item :label="$t('mijozTuri')" prop="mijozturi" required>
        <el-radio-group v-model="form.mijozturi" class="responsive-radio-group">
          <el-radio value="yuridik">{{ $t('yuridikShaxs') }}</el-radio>
          <el-radio value="jismoniy">{{ $t('jismoniyShaxs') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- INN (faqat yuridik shaxs uchun) -->
      <el-form-item :label="$t('inn')" v-if="form.mijozturi === 'yuridik'">
        <el-input v-model="form.inn" :placeholder="$t('kiriting')" class="full-width-input" />
      </el-form-item>

      <!-- TELEFON -->
      <el-form-item :label="$t('telefon')" prop="phone_number" required>
        <el-input
          v-model="form.phone_number"
          :placeholder="$t('kiriting')"
          class="full-width-input"
        />
      </el-form-item>

      <!-- QO'SHIMCHA TELEFON -->
      <el-form-item :label="$t('form_qoshimchaTelefon')">
        <el-input
          v-model="form.additional_phone_number"
          :placeholder="$t('form_qoshimchaTelefon_placeholder')"
          class="full-width-input"
        />
      </el-form-item>

      <!-- RESPUBLIKA -->
      <el-form-item :label="$t('respublika')" prop="republic" required>
        <el-select
          v-model="form.republic"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
          @change="onRepublicChange"
        >
          <el-option
            v-for="item in republicOptions"
            :key="item.key"
            :label="item.label"
            :value="item.key"
          />
        </el-select>
        <el-input
          v-if="form.republic === 'boshqa'"
          class="whereotherinput"
          v-model="form.otherrepublic"
          :placeholder="$t('qaysiRespublika')"
        />
      </el-form-item>

      <!-- VILOYAT -->
      <el-form-item :label="$t('viloyat')" prop="viloyat" required>
        <el-select
          v-model="form.viloyat"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
          :disabled="!form.republic || (form.republic === 'boshqa' && !form.otherrepublic)"
          @change="onViloyatChange"
        >
          <el-option
            v-for="item in availableViloyatlar"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-if="form.viloyat === 'boshqa'"
          class="whereotherinput"
          :rows="2"
          v-model="form.otherviloyat"
          :placeholder="$t('qaysiViloyat')"
          type="textarea"
        />
      </el-form-item>

      <!-- SHAHAR / TUMAN -->
      <el-form-item :label="$t('shaharTuman')" prop="shahar_tuman" required>
        <el-select
          v-model="form.shahar_tuman"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
          :disabled="!form.viloyat || (form.viloyat === 'boshqa' && !form.otherviloyat)"
          @change="onShaharTumanChange"
        >
          <el-option
            v-for="item in availableShaharTumanlar"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-if="form.shahar_tuman === 'boshqa'"
          class="whereotherinput"
          :rows="2"
          v-model="form.other_shahar_tuman"
          :placeholder="$t('qaysiShaharTuman')"
          type="textarea"
        />
      </el-form-item>
    </el-form>

    <div class="button-group-container">
      <el-button :loading="loading" type="primary" @click="onSubmit">{{ $t('save') }}</el-button>
      <el-button type="warning" plain @click="goback()">{{ $t('cancel') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { usePartnersStore } from '@/stores/partners'
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useI18n } from 'vue-i18n'

const partnersStore = usePartnersStore()
const loading = ref(false)
const { t } = useI18n()
const formRef = ref()

// ─── Cookie helper ────────────────────────────────────────────────────────────
function getCookie(name) {
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=')
    if (cookieName === name) return decodeURIComponent(cookieValue)
  }
  return 'uz'
}
const lang = getCookie('lang')

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  republic: '',
  otherrepublic: '',
  viloyat: '',
  otherviloyat: '',
  shahar_tuman: '',
  other_shahar_tuman: '',
  mijozturi: '',
  inn: '',
  phone_number: '',
  additional_phone_number: '',
  fullname: '',
})

// ─── Location data ────────────────────────────────────────────────────────────
const LOCATION_DATA = {
  ozbekiston: [
    {
      value: t('Toshkent shahri'),
      label: t('Toshkent shahri'),
      tumanlar: [
        { value: t('Bektemir'), label: t('Bektemir') },
        { value: t('Chilonzor'), label: t('Chilonzor') },
        { value: t('Yashnobod'), label: t('Yashnobod') },
        { value: t('Mirobod'), label: t('Mirobod') },
        { value: t("Mirzo Ulug'bek"), label: t("Mirzo Ulug'bek") },
        { value: t('Sergeli'), label: t('Sergeli') },
        { value: t('Shayxontohur'), label: t('Shayxontohur') },
        { value: t('Olmazor'), label: t('Olmazor') },
        { value: t('Uchtepa'), label: t('Uchtepa') },
        { value: t('Yakkasaroy'), label: t('Yakkasaroy') },
        { value: t('Yunusobod'), label: t('Yunusobod') },
        { value: t('Yangihayot'), label: t('Yangihayot') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Toshkent viloyati'),
      label: t('Toshkent viloyati'),
      tumanlar: [
        { value: t('Bekobod'), label: t('Bekobod') },
        { value: t("Bo'stonliq"), label: t("Bo'stonliq") },
        { value: t("Bo'ka"), label: t("Bo'ka") },
        { value: t('Chinoz'), label: t('Chinoz') },
        { value: t('Qibray'), label: t('Qibray') },
        { value: t('Ohangaron'), label: t('Ohangaron') },
        { value: t("Oqqo'rg'on"), label: t("Oqqo'rg'on") },
        { value: t('Parkent'), label: t('Parkent') },
        { value: t('Piskent'), label: t('Piskent') },
        { value: t('Quyi Chirchiq'), label: t('Quyi Chirchiq') },
        { value: t("O'rtachirchiq"), label: t("O'rtachirchiq") },
        { value: t("Yangiyo'l"), label: t("Yangiyo'l") },
        { value: t('Yuqori Chirchiq'), label: t('Yuqori Chirchiq') },
        { value: t('Zangiota'), label: t('Zangiota') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Andijon viloyati'),
      label: t('Andijon viloyati'),
      tumanlar: [
        { value: t('Andijon tumani'), label: t('Andijon tumani') },
        { value: t('Asaka'), label: t('Asaka') },
        { value: t('Baliqchi'), label: t('Baliqchi') },
        { value: t("Bo'ston"), label: t("Bo'ston") },
        { value: t('Buloqboshi'), label: t('Buloqboshi') },
        { value: t('Izboskan'), label: t('Izboskan') },
        { value: t('Jalaquduq'), label: t('Jalaquduq') },
        { value: t('Xoʻjaobod'), label: t('Xoʻjaobod') },
        { value: t("Qo'rg'ontepa"), label: t("Qo'rg'ontepa") },
        { value: t('Marhamat'), label: t('Marhamat') },
        { value: t("Oltinko'l"), label: t("Oltinko'l") },
        { value: t('Paxtaobod'), label: t('Paxtaobod') },
        { value: t('Shahrixon'), label: t('Shahrixon') },
        { value: t("Ulug'nor"), label: t("Ulug'nor") },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("Farg'ona viloyati"),
      label: t("Farg'ona viloyati"),
      tumanlar: [
        { value: t("Farg'ona shahri"), label: t("Farg'ona shahri") },
        { value: t("Farg'ona tumani"), label: t("Farg'ona tumani") },
        { value: t('Oltiariq'), label: t('Oltiariq') },
        { value: t("Bag'dod"), label: t("Bag'dod") },
        { value: t('Beshariq'), label: t('Beshariq') },
        { value: t('Buvayda'), label: t('Buvayda') },
        { value: t("Dang'ara"), label: t("Dang'ara") },
        { value: t('Furqat'), label: t('Furqat') },
        { value: t("Qo'qon"), label: t("Qo'qon") },
        { value: t("Qo'shtepa"), label: t("Qo'shtepa") },
        { value: t('Quva'), label: t('Quva') },
        { value: t('Rishton'), label: t('Rishton') },
        { value: t("So'x"), label: t("So'x") },
        { value: t('Toshloq'), label: t('Toshloq') },
        { value: t("Uchko'prik"), label: t("Uchko'prik") },
        { value: t("O'zbekiston tumani"), label: t("O'zbekiston tumani") },
        { value: t('Yozyovon'), label: t('Yozyovon') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Namangan viloyati'),
      label: t('Namangan viloyati'),
      tumanlar: [
        { value: t('Namangan shahri'), label: t('Namangan shahri') },
        { value: t('Chortoq'), label: t('Chortoq') },
        { value: t('Chust'), label: t('Chust') },
        { value: t('Kosonsoy'), label: t('Kosonsoy') },
        { value: t('Mingbuloq'), label: t('Mingbuloq') },
        { value: t('Namangan tumani'), label: t('Namangan tumani') },
        { value: t('Norin'), label: t('Norin') },
        { value: t('Pop'), label: t('Pop') },
        { value: t("To'raqo'rg'on"), label: t("To'raqo'rg'on") },
        { value: t("Uchqo'rg'on"), label: t("Uchqo'rg'on") },
        { value: t('Uychi'), label: t('Uychi') },
        { value: t("Yangiqo'rg'on"), label: t("Yangiqo'rg'on") },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Sirdaryo viloyati'),
      label: t('Sirdaryo viloyati'),
      tumanlar: [
        { value: t('Oqoltin'), label: t('Oqoltin') },
        { value: t('Boyovut'), label: t('Boyovut') },
        { value: t('Guliston'), label: t('Guliston') },
        { value: t('Xovos'), label: t('Xovos') },
        { value: t('Mirzaobod'), label: t('Mirzaobod') },
        { value: t('Sayxunobod'), label: t('Sayxunobod') },
        { value: t('Sardoba'), label: t('Sardoba') },
        { value: t('Sirdaryo tumani'), label: t('Sirdaryo tumani') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Jizzax viloyati'),
      label: t('Jizzax viloyati'),
      tumanlar: [
        { value: t('Jizzax shahri'), label: t('Jizzax shahri') },
        { value: t('Arnasoy'), label: t('Arnasoy') },
        { value: t('Baxmal'), label: t('Baxmal') },
        { value: t("Do'stlik"), label: t("Do'stlik") },
        { value: t('Forish'), label: t('Forish') },
        { value: t("G'allaorol"), label: t("G'allaorol") },
        { value: t('Sharof Rashidov'), label: t('Sharof Rashidov') },
        { value: t("Mirzacho'l"), label: t("Mirzacho'l") },
        { value: t('Paxtakor'), label: t('Paxtakor') },
        { value: t('Yangiobod'), label: t('Yangiobod') },
        { value: t('Zomin'), label: t('Zomin') },
        { value: t('Zafarobod'), label: t('Zafarobod') },
        { value: t('Zarbdor'), label: t('Zarbdor') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Samarqand viloyati'),
      label: t('Samarqand viloyati'),
      tumanlar: [
        { value: t('Samarqand shahri'), label: t('Samarqand shahri') },
        { value: t('Samarqand tumani'), label: t('Samarqand tumani') },
        { value: t("Bulung'ur"), label: t("Bulung'ur") },
        { value: t('Ishtixon'), label: t('Ishtixon') },
        { value: t('Jomboy'), label: t('Jomboy') },
        { value: t("Kattaqo'rg'on"), label: t("Kattaqo'rg'on") },
        { value: t("Qo'shrabot"), label: t("Qo'shrabot") },
        { value: t('Narpay'), label: t('Narpay') },
        { value: t('Nurobod'), label: t('Nurobod') },
        { value: t('Oqdaryo'), label: t('Oqdaryo') },
        { value: t('Paxtachi'), label: t('Paxtachi') },
        { value: t('Payariq'), label: t('Payariq') },
        { value: t("Pastdarg'om"), label: t("Pastdarg'om") },
        { value: t('Toyloq'), label: t('Toyloq') },
        { value: t('Urgut'), label: t('Urgut') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Qashqadaryo viloyati'),
      label: t('Qashqadaryo viloyati'),
      tumanlar: [
        { value: t('Qarshi shahri'), label: t('Qarshi shahri') },
        { value: t('Chiroqchi'), label: t('Chiroqchi') },
        { value: t('Dehqonobod'), label: t('Dehqonobod') },
        { value: t("G'uzor"), label: t("G'uzor") },
        { value: t('Kamashi'), label: t('Kamashi') },
        { value: t('Kasbi'), label: t('Kasbi') },
        { value: t('Kitob'), label: t('Kitob') },
        { value: t('Koson'), label: t('Koson') },
        { value: t('Mirishkor'), label: t('Mirishkor') },
        { value: t('Muborak'), label: t('Muborak') },
        { value: t('Nishon'), label: t('Nishon') },
        { value: t('Qamashi'), label: t('Qamashi') },
        { value: t('Shahrisabz'), label: t('Shahrisabz') },
        { value: t("Yakkabog'"), label: t("Yakkabog'") },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Surxondaryo viloyati'),
      label: t('Surxondaryo viloyati'),
      tumanlar: [
        { value: t('Termiz shahri'), label: t('Termiz shahri') },
        { value: t('Angor'), label: t('Angor') },
        { value: t('Boysun'), label: t('Boysun') },
        { value: t('Denov'), label: t('Denov') },
        { value: t("Jarqo'rg'on"), label: t("Jarqo'rg'on") },
        { value: t('Qiziriq'), label: t('Qiziriq') },
        { value: t("Qumqo'rg'on"), label: t("Qumqo'rg'on") },
        { value: t('Muzrabot'), label: t('Muzrabot') },
        { value: t('Oltinsoy'), label: t('Oltinsoy') },
        { value: t('Sariosiyo'), label: t('Sariosiyo') },
        { value: t('Sherobod'), label: t('Sherobod') },
        { value: t("Sho'rchi"), label: t("Sho'rchi") },
        { value: t('Termiz'), label: t('Termiz') },
        { value: t('Uzun'), label: t('Uzun') },
        { value: t('Bandixon'), label: t('Bandixon') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Navoiy viloyati'),
      label: t('Navoiy viloyati'),
      tumanlar: [
        { value: t('Konimex'), label: t('Konimex') },
        { value: t('Navoiy shahri'), label: t('Navoiy shahri') },
        { value: t('Karmana'), label: t('Karmana') },
        { value: t('Qiziltepa'), label: t('Qiziltepa') },
        { value: t('Xatirchi'), label: t('Xatirchi') },
        { value: t('Navbahor'), label: t('Navbahor') },
        { value: t('Nurota'), label: t('Nurota') },
        { value: t('Tomdi'), label: t('Tomdi') },
        { value: t('Uchquduq'), label: t('Uchquduq') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Buxoro viloyati'),
      label: t('Buxoro viloyati'),
      tumanlar: [
        { value: t('Buxoro tumani'), label: t('Buxoro tumani') },
        { value: t('Buxoro shahri'), label: t('Buxoro shahri') },
        { value: t('Olot'), label: t('Olot') },
        { value: t("G'ijduvon"), label: t("G'ijduvon") },
        { value: t('Jondor'), label: t('Jondor') },
        { value: t('Kogon'), label: t('Kogon') },
        { value: t("Qorako'l"), label: t("Qorako'l") },
        { value: t('Peshku'), label: t('Peshku') },
        { value: t('Qorovulbozor'), label: t('Qorovulbozor') },
        { value: t('Romitan'), label: t('Romitan') },
        { value: t('Shofirkon'), label: t('Shofirkon') },
        { value: t('Vobkent'), label: t('Vobkent') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Xorazm viloyati'),
      label: t('Xorazm viloyati'),
      tumanlar: [
        { value: t('Urganch shahri'), label: t('Urganch shahri') },
        { value: t("Bog'ot"), label: t("Bog'ot") },
        { value: t('Gurlan'), label: t('Gurlan') },
        { value: t('Xonqa'), label: t('Xonqa') },
        { value: t('Hazorasp'), label: t('Hazorasp') },
        { value: t('Xiva'), label: t('Xiva') },
        { value: t("Qo'shko'pir"), label: t("Qo'shko'pir") },
        { value: t('Shovot'), label: t('Shovot') },
        { value: t('Urganch tumani'), label: t('Urganch tumani') },
        { value: t('Yangiariq'), label: t('Yangiariq') },
        { value: t('Yangibozor'), label: t('Yangibozor') },
        { value: t("Tuproqqal'a"), label: t("Tuproqqal'a") },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("Qoraqalpog'iston Respublikasi"),
      label: t("Qoraqalpog'iston Respublikasi"),
      tumanlar: [
        { value: t('Nukus shahri'), label: t('Nukus shahri') },
        { value: t('Amudaryo'), label: t('Amudaryo') },
        { value: t('Beruniy'), label: t('Beruniy') },
        { value: t('Chimboy'), label: t('Chimboy') },
        { value: t("Elliqqa'la"), label: t("Elliqqa'la") },
        { value: t('Kegeyli'), label: t('Kegeyli') },
        { value: t("Mo'ynoq"), label: t("Mo'ynoq") },
        { value: t('Nukus tumani'), label: t('Nukus tumani') },
        { value: t("Qanliko'l"), label: t("Qanliko'l") },
        { value: t("Qo'ng'irot"), label: t("Qo'ng'irot") },
        { value: t('Shumanay'), label: t('Shumanay') },
        { value: t("Taxtako'pir"), label: t("Taxtako'pir") },
        { value: t("To'rtko'l"), label: t("To'rtko'l") },
        { value: t("Xo'jayli"), label: t("Xo'jayli") },
        { value: t('Taxiatosh'), label: t('Taxiatosh') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
  ],

  qozogiston: [
    {
      value: t('Astana (poytaxt)'),
      label: t('Astana (poytaxt)'),
      tumanlar: [
        { value: t('Almaty rayoni'), label: t('Almaty rayoni') },
        { value: t('Bayseri rayoni'), label: t('Bayseri rayoni') },
        { value: t('Esil rayoni'), label: t('Esil rayoni') },
        { value: t('Nura rayoni'), label: t('Nura rayoni') },
        { value: t('Saryarka rayoni'), label: t('Saryarka rayoni') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Almaty shahri'),
      label: t('Almaty shahri'),
      tumanlar: [
        { value: t('Alatau'), label: t('Alatau') },
        { value: t('Almalı'), label: t('Almalı') },
        { value: t('Auezov'), label: t('Auezov') },
        { value: t('Bostandıq'), label: t('Bostandıq') },
        { value: t('Jetisu'), label: t('Jetisu') },
        { value: t('Medeu'), label: t('Medeu') },
        { value: t('Naurizbay'), label: t('Naurizbay') },
        { value: t('Turksib'), label: t('Turksib') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Shymkent shahri'),
      label: t('Shymkent shahri'),
      tumanlar: [
        { value: t('Abay rayoni'), label: t('Abay rayoni') },
        { value: t('Al-Farabi rayoni'), label: t('Al-Farabi rayoni') },
        { value: t('Yenbek rayoni'), label: t('Yenbek rayoni') },
        { value: t('Karatau rayoni'), label: t('Karatau rayoni') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Almaty viloyati'),
      label: t('Almaty viloyati'),
      tumanlar: [
        { value: t('Aksu'), label: t('Aksu') },
        { value: t('Balqash'), label: t('Balqash') },
        { value: t('Yenbekshiqazaq'), label: t('Yenbekshiqazaq') },
        { value: t('Eskeldı'), label: t('Eskeldı') },
        { value: t('Ile'), label: t('Ile') },
        { value: t('Karasay'), label: t('Karasay') },
        { value: t('Kerbulaq'), label: t('Kerbulaq') },
        { value: t("Ko'ksu"), label: t("Ko'ksu") },
        { value: t('Panfilov'), label: t('Panfilov') },
        { value: t('Rayimbek'), label: t('Rayimbek') },
        { value: t('Sarqan'), label: t('Sarqan') },
        { value: t('Talgar'), label: t('Talgar') },
        { value: t('Uyghur'), label: t('Uyghur') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Aqmola viloyati'),
      label: t('Aqmola viloyati'),
      tumanlar: [
        { value: t('Arshaly'), label: t('Arshaly') },
        { value: t('Astraxanka'), label: t('Astraxanka') },
        { value: t('Atbasar'), label: t('Atbasar') },
        { value: t('Birzhan sal'), label: t('Birzhan sal') },
        { value: t('Burabay'), label: t('Burabay') },
        { value: t("Yegindiko'l"), label: t("Yegindiko'l") },
        { value: t('Yereymentau'), label: t('Yereymentau') },
        { value: t("Yesil'"), label: t("Yesil'") },
        { value: t("Ko'kshetau"), label: t("Ko'kshetau") },
        { value: t('Sandıqtau'), label: t('Sandıqtau') },
        { value: t('Shortandı'), label: t('Shortandı') },
        { value: t('Stepnogorsk'), label: t('Stepnogorsk') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Aqtobe viloyati'),
      label: t('Aqtobe viloyati'),
      tumanlar: [
        { value: t('Alga'), label: t('Alga') },
        { value: t('Bayganin'), label: t('Bayganin') },
        { value: t('Yembi'), label: t('Yembi') },
        { value: t('Irgiz'), label: t('Irgiz') },
        { value: t('Qargalı'), label: t('Qargalı') },
        { value: t('Martuk'), label: t('Martuk') },
        { value: t('Mugaljar'), label: t('Mugaljar') },
        { value: t('Oyıl'), label: t('Oyıl') },
        { value: t('Shalqar'), label: t('Shalqar') },
        { value: t('Temir'), label: t('Temir') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Atyrau viloyati'),
      label: t('Atyrau viloyati'),
      tumanlar: [
        { value: t('İnder'), label: t('İnder') },
        { value: t('İsatay'), label: t('İsatay') },
        { value: t('Qızılqoğa'), label: t('Qızılqoğa') },
        { value: t('Maqambet'), label: t('Maqambet') },
        { value: t('Qurmangazı'), label: t('Qurmangazı') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("Sharqiy Qozog'iston viloyati"),
      label: t("Sharqiy Qozog'iston viloyati"),
      tumanlar: [
        { value: t('Abay'), label: t('Abay') },
        { value: t('Ayagöz'), label: t('Ayagöz') },
        { value: t('Borodulixa'), label: t('Borodulixa') },
        { value: t('Qürşim'), label: t('Qürşim') },
        { value: t('Ridder'), label: t('Ridder') },
        { value: t('Semey'), label: t('Semey') },
        { value: t('Öskemen'), label: t('Öskemen') },
        { value: t('Zaysan'), label: t('Zaysan') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Jambil viloyati'),
      label: t('Jambil viloyati'),
      tumanlar: [
        { value: t('Bayzaq'), label: t('Bayzaq') },
        { value: t('Jambıl'), label: t('Jambıl') },
        { value: t('Korday'), label: t('Korday') },
        { value: t('Merqı'), label: t('Merqı') },
        { value: t('Moyınqum'), label: t('Moyınqum') },
        { value: t('Shu'), label: t('Shu') },
        { value: t('Taraz'), label: t('Taraz') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Qizilorda viloyati'),
      label: t('Qizilorda viloyati'),
      tumanlar: [
        { value: t('Aral'), label: t('Aral') },
        { value: t('Jangaqorğan'), label: t('Jangaqorğan') },
        { value: t('Qarmaqşı'), label: t('Qarmaqşı') },
        { value: t('Qazaly'), label: t('Qazaly') },
        { value: t('Shïeli'), label: t('Shïeli') },
        { value: t('Sırdarıya'), label: t('Sırdarıya') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Qostanay viloyati'),
      label: t('Qostanay viloyati'),
      tumanlar: [
        { value: t('Amangeldı'), label: t('Amangeldı') },
        { value: t('Äwlïekol'), label: t('Äwlïekol') },
        { value: t('Denisov'), label: t('Denisov') },
        { value: t('Qostanay'), label: t('Qostanay') },
        { value: t('Lisakovsk'), label: t('Lisakovsk') },
        { value: t('Rüdnïy'), label: t('Rüdnïy') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Mangistau viloyati'),
      label: t('Mangistau viloyati'),
      tumanlar: [
        { value: t('Aktau'), label: t('Aktau') },
        { value: t('Beyneu'), label: t('Beyneu') },
        { value: t('Mangistau'), label: t('Mangistau') },
        { value: t('Münayly'), label: t('Münayly') },
        { value: t('Tupqarağan'), label: t('Tupqarağan') },
        { value: t('Janaözen'), label: t('Janaözen') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Pavlodar viloyati'),
      label: t('Pavlodar viloyati'),
      tumanlar: [
        { value: t('Aqsü'), label: t('Aqsü') },
        { value: t('Bayan-Awıl'), label: t('Bayan-Awıl') },
        { value: t('Yekibastuz'), label: t('Yekibastuz') },
        { value: t('Yertis'), label: t('Yertis') },
        { value: t('Pavlodar'), label: t('Pavlodar') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("Shimoliy Qozog'iston viloyati"),
      label: t("Shimoliy Qozog'iston viloyati"),
      tumanlar: [
        { value: t('Aısharıq'), label: t('Aısharıq') },
        { value: t('Aqkayın'), label: t('Aqkayın') },
        { value: t('Timiryazev'), label: t('Timiryazev') },
        { value: t('Petropavl'), label: t('Petropavl') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Turkiston viloyati'),
      label: t('Turkiston viloyati'),
      tumanlar: [
        { value: t('Arıs'), label: t('Arıs') },
        { value: t('Baydïbek'), label: t('Baydïbek') },
        { value: t('Kentau'), label: t('Kentau') },
        { value: t('Kentau rayoni'), label: t('Kentau rayoni') },
        { value: t('Otırar'), label: t('Otırar') },
        { value: t('Sayram'), label: t('Sayram') },
        { value: t('Sozaq'), label: t('Sozaq') },
        { value: t('Turkiston'), label: t('Turkiston') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("G'arbiy Qozog'iston viloyati"),
      label: t("G'arbiy Qozog'iston viloyati"),
      tumanlar: [
        { value: t('Aqsay'), label: t('Aqsay') },
        { value: t('Aqjayıq'), label: t('Aqjayıq') },
        { value: t('Boke Biy'), label: t('Boke Biy') },
        { value: t('Shynghırlau'), label: t('Shynghırlau') },
        { value: t('Qaztalov'), label: t('Qaztalov') },
        { value: t('Oral'), label: t('Oral') },
        { value: t('Terekty'), label: t('Terekty') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
  ],

  tojikiston: [
    {
      value: t('Dushanbe (poytaxt)'),
      label: t('Dushanbe (poytaxt)'),
      tumanlar: [
        { value: t('Ismoili Somoniy'), label: t('Ismoili Somoniy') },
        { value: t('Firdavsiy'), label: t('Firdavsiy') },
        { value: t('Sino'), label: t('Sino') },
        { value: t('Shohmansur'), label: t('Shohmansur') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("Sug'd viloyati"),
      label: t("Sug'd viloyati"),
      tumanlar: [
        { value: t("Xo'jand"), label: t("Xo'jand") },
        { value: t('Asht'), label: t('Asht') },
        { value: t('Ayni'), label: t('Ayni') },
        { value: t("Bobojon G'afurov"), label: t("Bobojon G'afurov") },
        { value: t('Ganchi'), label: t('Ganchi') },
        { value: t('Isfara'), label: t('Isfara') },
        { value: t('Istaravshan'), label: t('Istaravshan') },
        { value: t('J. Rayhon'), label: t('J. Rayhon') },
        { value: t('Konibodim'), label: t('Konibodim') },
        { value: t("Mastcho'h"), label: t("Mastcho'h") },
        { value: t('Panjakent'), label: t('Panjakent') },
        { value: t('Shahriston'), label: t('Shahriston') },
        { value: t('Spitamen'), label: t('Spitamen') },
        { value: t('Zafarobod'), label: t('Zafarobod') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Xatlon viloyati'),
      label: t('Xatlon viloyati'),
      tumanlar: [
        { value: t('Boxtar'), label: t('Boxtar') },
        { value: t('Kulob'), label: t('Kulob') },
        { value: t("Dang'ara"), label: t("Dang'ara") },
        { value: t('Farkhor'), label: t('Farkhor') },
        { value: t('Hamadoni'), label: t('Hamadoni') },
        { value: t('Xuroson'), label: t('Xuroson') },
        { value: t("Mo'minobod"), label: t("Mo'minobod") },
        { value: t('Nosir Xusrav'), label: t('Nosir Xusrav') },
        { value: t('Qubodiyon'), label: t('Qubodiyon') },
        { value: t('Sarband'), label: t('Sarband') },
        { value: t('Shurobod'), label: t('Shurobod') },
        { value: t('Temurmalik'), label: t('Temurmalik') },
        { value: t('Vaxsh'), label: t('Vaxsh') },
        { value: t('Yovon'), label: t('Yovon') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("Respublikaga bo'ysunmaydigan tumanlar"),
      label: t("Respublikaga bo'ysunmaydigan tumanlar"),
      tumanlar: [
        { value: t('Fayzobod'), label: t('Fayzobod') },
        { value: t('Hisor'), label: t('Hisor') },
        { value: t('Isfara'), label: t('Isfara') },
        { value: t('Nurek'), label: t('Nurek') },
        { value: t('Rasht'), label: t('Rasht') },
        { value: t("Rog'un"), label: t("Rog'un") },
        { value: t('Rudaki'), label: t('Rudaki') },
        { value: t('Shahrinav'), label: t('Shahrinav') },
        { value: t('Tursunzoda'), label: t('Tursunzoda') },
        { value: t('Varzob'), label: t('Varzob') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("Tog'li Badaxshon Avtonom viloyati"),
      label: t("Tog'li Badaxshon Avtonom viloyati"),
      tumanlar: [
        { value: t("Xorug'"), label: t("Xorug'") },
        { value: t('Bartang'), label: t('Bartang') },
        { value: t('Darvoz'), label: t('Darvoz') },
        { value: t('Ishkoshim'), label: t('Ishkoshim') },
        { value: t("Murg'ob"), label: t("Murg'ob") },
        { value: t("Roshtqal'a"), label: t("Roshtqal'a") },
        { value: t('Rushan'), label: t('Rushan') },
        { value: t("Shug'non"), label: t("Shug'non") },
        { value: t('Vanj'), label: t('Vanj') },
        { value: t('Vaxon'), label: t('Vaxon') },
        { value: t("Yazg'ulom"), label: t("Yazg'ulom") },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
  ],

  turkmaniston: [
    {
      value: t('Ashgabat (poytaxt)'),
      label: t('Ashgabat (poytaxt)'),
      tumanlar: [
        { value: t('Markaz'), label: t('Markaz') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Ahal viloyati'),
      label: t('Ahal viloyati'),
      tumanlar: [
        { value: t('Anau'), label: t('Anau') },
        { value: t('Arkadag'), label: t('Arkadag') },
        { value: t('Babadayhan'), label: t('Babadayhan') },
        { value: t('Baxarli'), label: t('Baxarli') },
        { value: t("Go'kdepe"), label: t("Go'kdepe") },
        { value: t('Kaka'), label: t('Kaka') },
        { value: t('Tejen'), label: t('Tejen') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Balkan viloyati'),
      label: t('Balkan viloyati'),
      tumanlar: [
        { value: t('Balkanobod'), label: t('Balkanobod') },
        { value: t('Bereket'), label: t('Bereket') },
        { value: t('Yesenguli'), label: t('Yesenguli') },
        { value: t('Etrek'), label: t('Etrek') },
        { value: t('Magtimguli'), label: t('Magtimguli') },
        { value: t('Serdar'), label: t('Serdar') },
        { value: t('Türkmenbaşı'), label: t('Türkmenbaşı') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Daşoguz viloyati'),
      label: t('Daşoguz viloyati'),
      tumanlar: [
        { value: t('Daşoguz'), label: t('Daşoguz') },
        { value: t('Akdepe'), label: t('Akdepe') },
        { value: t('Gubadak'), label: t('Gubadak') },
        { value: t("Ko'neürgenç"), label: t("Ko'neürgenç") },
        { value: t('Ruhowbelent'), label: t('Ruhowbelent') },
        { value: t('S.Türkmenbaşy'), label: t('S.Türkmenbaşy') },
        { value: t('Tagta'), label: t('Tagta') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Lebap viloyati'),
      label: t('Lebap viloyati'),
      tumanlar: [
        { value: t('Türkmenabat'), label: t('Türkmenabat') },
        { value: t('Atamurat'), label: t('Atamurat') },
        { value: t('Deynaw'), label: t('Deynaw') },
        { value: t('Farap'), label: t('Farap') },
        { value: t('Gowurdak'), label: t('Gowurdak') },
        { value: t('Halaç'), label: t('Halaç') },
        { value: t('Kerki'), label: t('Kerki') },
        { value: t('Sakar'), label: t('Sakar') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Mary viloyati'),
      label: t('Mary viloyati'),
      tumanlar: [
        { value: t('Mary'), label: t('Mary') },
        { value: t('Baýramaly'), label: t('Baýramaly') },
        { value: t('Murgap'), label: t('Murgap') },
        { value: t('Sakarçäge'), label: t('Sakarçäge') },
        { value: t('Tagtabazar'), label: t('Tagtabazar') },
        { value: t('Türkmengala'), label: t('Türkmengala') },
        { value: t('Ýolöten'), label: t('Ýolöten') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
  ],

  qizgiziston: [
    {
      value: t('Bishkek (poytaxt)'),
      label: t('Bishkek (poytaxt)'),
      tumanlar: [
        { value: t('Birinchi may'), label: t('Birinchi may') },
        { value: t('Leninski'), label: t('Leninski') },
        { value: t("Oktyabr'"), label: t("Oktyabr'") },
        { value: t('Sverdlovsk'), label: t('Sverdlovsk') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Osh shahri'),
      label: t('Osh shahri'),
      tumanlar: [
        { value: t('Markaz'), label: t('Markaz') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Chüy viloyati'),
      label: t('Chüy viloyati'),
      tumanlar: [
        { value: t('Tokmok'), label: t('Tokmok') },
        { value: t('Alamüdün'), label: t('Alamüdün') },
        { value: t('Issıq-Ata'), label: t('Issıq-Ata') },
        { value: t('Jayıl'), label: t('Jayıl') },
        { value: t('Kemin'), label: t('Kemin') },
        { value: t('Moskovskiy'), label: t('Moskovskiy') },
        { value: t('Panfilov'), label: t('Panfilov') },
        { value: t('Sokuluk'), label: t('Sokuluk') },
        { value: t('Ysıq-Ata'), label: t('Ysıq-Ata') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Jalal-Obod viloyati'),
      label: t('Jalal-Obod viloyati'),
      tumanlar: [
        { value: t('Jalal-Obod'), label: t('Jalal-Obod') },
        { value: t('Aksı'), label: t('Aksı') },
        { value: t('Ala-Buka'), label: t('Ala-Buka') },
        { value: t("Bazar-Qo'rg'on"), label: t("Bazar-Qo'rg'on") },
        { value: t('Nooken'), label: t('Nooken') },
        { value: t('Suzak'), label: t('Suzak') },
        { value: t("Tog'uz-Toro"), label: t("Tog'uz-Toro") },
        { value: t('Toktogul'), label: t('Toktogul') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t("Ysıq-Ko'l viloyati"),
      label: t("Ysıq-Ko'l viloyati"),
      tumanlar: [
        { value: t('Karakol'), label: t('Karakol') },
        { value: t('Ak-Suu'), label: t('Ak-Suu') },
        { value: t("Jeti-O'guz"), label: t("Jeti-O'guz") },
        { value: t('Tong'), label: t('Tong') },
        { value: t('Tüp'), label: t('Tüp') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Narın viloyati'),
      label: t('Narın viloyati'),
      tumanlar: [
        { value: t('Narın'), label: t('Narın') },
        { value: t('Ak-Talaa'), label: t('Ak-Talaa') },
        { value: t('At-Başı'), label: t('At-Başı') },
        { value: t('Jumgal'), label: t('Jumgal') },
        { value: t('Qochqor'), label: t('Qochqor') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Batken viloyati'),
      label: t('Batken viloyati'),
      tumanlar: [
        { value: t('Batken'), label: t('Batken') },
        { value: t('Qadamjay'), label: t('Qadamjay') },
        { value: t('Qızılqıya'), label: t('Qızılqıya') },
        { value: t('Leylek'), label: t('Leylek') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Talas viloyati'),
      label: t('Talas viloyati'),
      tumanlar: [
        { value: t('Talas'), label: t('Talas') },
        { value: t('Bakai-Ata'), label: t('Bakai-Ata') },
        { value: t('Qara-Buura'), label: t('Qara-Buura') },
        { value: t('Manas'), label: t('Manas') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Osh viloyati'),
      label: t('Osh viloyati'),
      tumanlar: [
        { value: t('Aravan'), label: t('Aravan') },
        { value: t('Qara-Suu'), label: t('Qara-Suu') },
        { value: t('Nookat'), label: t('Nookat') },
        { value: t("O'zgon"), label: t("O'zgon") },
        { value: t("O'zgen"), label: t("O'zgen") },
        { value: t('Alay'), label: t('Alay') },
        { value: t("Cho'n-Alay"), label: t("Cho'n-Alay") },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
  ],

  afgoniston: [
    {
      value: t('Kobul viloyati'),
      label: t('Kobul viloyati'),
      tumanlar: [
        { value: t('Kobul shahri'), label: t('Kobul shahri') },
        { value: t('Bagrami'), label: t('Bagrami') },
        { value: t('Chahar Asiyob'), label: t('Chahar Asiyob') },
        { value: t('Deh Sabz'), label: t('Deh Sabz') },
        { value: t('Istalif'), label: t('Istalif') },
        { value: t('Farza'), label: t('Farza') },
        { value: t('Guldara'), label: t('Guldara') },
        { value: t('Kalakan'), label: t('Kalakan') },
        { value: t("Mir Bacha Ko't"), label: t("Mir Bacha Ko't") },
        { value: t('Musahi'), label: t('Musahi') },
        { value: t("Pag'mon"), label: t("Pag'mon") },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Hirot viloyati'),
      label: t('Hirot viloyati'),
      tumanlar: [
        { value: t('Hirot shahri'), label: t('Hirot shahri') },
        { value: t('Adraskan'), label: t('Adraskan') },
        { value: t('Chishti Sharif'), label: t('Chishti Sharif') },
        { value: t('Guzara'), label: t('Guzara') },
        { value: t('Injil'), label: t('Injil') },
        { value: t('Karux'), label: t('Karux') },
        { value: t('Obe'), label: t('Obe') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Balx viloyati'),
      label: t('Balx viloyati'),
      tumanlar: [
        { value: t('Mozori Sharif'), label: t('Mozori Sharif') },
        { value: t('Balx'), label: t('Balx') },
        { value: t('Char Bolak'), label: t('Char Bolak') },
        { value: t('Chimtal'), label: t('Chimtal') },
        { value: t('Davlatobod'), label: t('Davlatobod') },
        { value: t('Keleft'), label: t('Keleft') },
        { value: t('Nahri Shahi'), label: t('Nahri Shahi') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Qunduz viloyati'),
      label: t('Qunduz viloyati'),
      tumanlar: [
        { value: t('Qunduz shahri'), label: t('Qunduz shahri') },
        { value: t('Ali Obod'), label: t('Ali Obod') },
        { value: t('Char Dara'), label: t('Char Dara') },
        { value: t('Dasht-e-Archi'), label: t('Dasht-e-Archi') },
        { value: t('Imom Sahib'), label: t('Imom Sahib') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Qandahor viloyati'),
      label: t('Qandahor viloyati'),
      tumanlar: [
        { value: t('Qandahor shahri'), label: t('Qandahor shahri') },
        { value: t("Arg'andob"), label: t("Arg'andob") },
        { value: t('Daman'), label: t('Daman') },
        { value: t('Xakrez'), label: t('Xakrez') },
        { value: t('Mayvand'), label: t('Mayvand') },
        { value: t('Spin Boldak'), label: t('Spin Boldak') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Nangarxar viloyati'),
      label: t('Nangarxar viloyati'),
      tumanlar: [
        { value: t('Jalolobod'), label: t('Jalolobod') },
        { value: t('Achin'), label: t('Achin') },
        { value: t('Behsud'), label: t('Behsud') },
        { value: t('Xiwa'), label: t('Xiwa') },
        { value: t('Kuz Kunar'), label: t('Kuz Kunar') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Boshqa viloyatlar'),
      label: t('Boshqa viloyatlar'),
      tumanlar: [{ value: t('Boshqa'), label: t('Boshqa') }],
    },
  ],

  azarbayjon: [
    {
      value: t('Boku (poytaxt)'),
      label: t('Boku (poytaxt)'),
      tumanlar: [
        { value: t('Binə'), label: t('Binə') },
        { value: t('Qaradağ'), label: t('Qaradağ') },
        { value: t('Xəzər'), label: t('Xəzər') },
        { value: t('Nərimanov'), label: t('Nərimanov') },
        { value: t('Nizami'), label: t('Nizami') },
        { value: t('Pirəllahi'), label: t('Pirəllahi') },
        { value: t('Səbail'), label: t('Səbail') },
        { value: t('Sabunçu'), label: t('Sabunçu') },
        { value: t('Suraxanı'), label: t('Suraxanı') },
        { value: t('Yasamal'), label: t('Yasamal') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Ganja shahri'),
      label: t('Ganja shahri'),
      tumanlar: [
        { value: t('Ganja markaz'), label: t('Ganja markaz') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Sumqayıt shahri'),
      label: t('Sumqayıt shahri'),
      tumanlar: [
        { value: t('Sumqayıt markaz'), label: t('Sumqayıt markaz') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Abşeron rayonu'),
      label: t('Abşeron rayonu'),
      tumanlar: [
        { value: t('Hacı Zeynalabdin'), label: t('Hacı Zeynalabdin') },
        { value: t('Xırdalan'), label: t('Xırdalan') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Ağcabədi rayonu'),
      label: t('Ağcabədi rayonu'),
      tumanlar: [
        { value: t('Ağcabədi'), label: t('Ağcabədi') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Bərdə rayonu'),
      label: t('Bərdə rayonu'),
      tumanlar: [
        { value: t('Bərdə'), label: t('Bərdə') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Qax rayonu'),
      label: t('Qax rayonu'),
      tumanlar: [
        { value: t('Qax'), label: t('Qax') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Lənkəran'),
      label: t('Lənkəran'),
      tumanlar: [
        { value: t('Lənkəran shahri'), label: t('Lənkəran shahri') },
        { value: t('Astara'), label: t('Astara') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Naxçıvan MR'),
      label: t('Naxçıvan MR'),
      tumanlar: [
        { value: t('Naxçıvan'), label: t('Naxçıvan') },
        { value: t('Babek'), label: t('Babek') },
        { value: t('Culfa'), label: t('Culfa') },
        { value: t('Ordubad'), label: t('Ordubad') },
        { value: t('Sədərək'), label: t('Sədərək') },
        { value: t('Şahbuz'), label: t('Şahbuz') },
        { value: t('Şərur'), label: t('Şərur') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Boshqa rayonlar'),
      label: t('Boshqa rayonlar'),
      tumanlar: [{ value: t('Boshqa'), label: t('Boshqa') }],
    },
  ],

  eron: [
    {
      value: t('Tehron viloyati'),
      label: t('Tehron viloyati'),
      tumanlar: [
        { value: t('Tehron shahri'), label: t('Tehron shahri') },
        { value: t('Karaj'), label: t('Karaj') },
        { value: t('Eslamshahr'), label: t('Eslamshahr') },
        { value: t('Rey'), label: t('Rey') },
        { value: t('Shemiranat'), label: t('Shemiranat') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Isfahan viloyati'),
      label: t('Isfahan viloyati'),
      tumanlar: [
        { value: t('Isfahan'), label: t('Isfahan') },
        { value: t('Kashan'), label: t('Kashan') },
        { value: t('Najafobod'), label: t('Najafobod') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Fors viloyati'),
      label: t('Fors viloyati'),
      tumanlar: [
        { value: t('Sheroz'), label: t('Sheroz') },
        { value: t('Marvdasht'), label: t('Marvdasht') },
        { value: t('Fasa'), label: t('Fasa') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Razaviy Xuroson viloyati'),
      label: t('Razaviy Xuroson viloyati'),
      tumanlar: [
        { value: t('Mashhad'), label: t('Mashhad') },
        { value: t('Nishopur'), label: t('Nishopur') },
        { value: t('Sabzevar'), label: t('Sabzevar') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Sharqiy Ozarbayjon viloyati'),
      label: t('Sharqiy Ozarbayjon viloyati'),
      tumanlar: [
        { value: t('Tabriz'), label: t('Tabriz') },
        { value: t('Maragha'), label: t('Maragha') },
        { value: t('Marand'), label: t('Marand') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Boshqa viloyatlar'),
      label: t('Boshqa viloyatlar'),
      tumanlar: [{ value: t('Boshqa'), label: t('Boshqa') }],
    },
  ],

  pokiston: [
    {
      value: t('Panjob viloyati'),
      label: t('Panjob viloyati'),
      tumanlar: [
        { value: t('Lahor'), label: t('Lahor') },
        { value: t('Faysolobod'), label: t('Faysolobod') },
        { value: t('Rovalpindi'), label: t('Rovalpindi') },
        { value: t('Gujranvala'), label: t('Gujranvala') },
        { value: t('Multon'), label: t('Multon') },
        { value: t('Syolkot'), label: t('Syolkot') },
        { value: t("Sarg'oda"), label: t("Sarg'oda") },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Sind viloyati'),
      label: t('Sind viloyati'),
      tumanlar: [
        { value: t('Karachi'), label: t('Karachi') },
        { value: t('Haydarobod'), label: t('Haydarobod') },
        { value: t('Sukkur'), label: t('Sukkur') },
        { value: t('Larkana'), label: t('Larkana') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Xaybar Paxtunxva viloyati'),
      label: t('Xaybar Paxtunxva viloyati'),
      tumanlar: [
        { value: t('Peshovar'), label: t('Peshovar') },
        { value: t('Abbottobod'), label: t('Abbottobod') },
        { value: t('Mardon'), label: t('Mardon') },
        { value: t('Svat'), label: t('Svat') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Balujiston viloyati'),
      label: t('Balujiston viloyati'),
      tumanlar: [
        { value: t('Kvetta'), label: t('Kvetta') },
        { value: t('Gvadar'), label: t('Gvadar') },
        { value: t('Turbat'), label: t('Turbat') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Islomobod (poytaxt hududiy birlik)'),
      label: t('Islomobod (poytaxt hududiy birlik)'),
      tumanlar: [
        { value: t('Islomobod'), label: t('Islomobod') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
  ],

  armeniya: [
    {
      value: t('Yerevan (poytaxt)'),
      label: t('Yerevan (poytaxt)'),
      tumanlar: [
        { value: t('Ajapnyak'), label: t('Ajapnyak') },
        { value: t('Avan'), label: t('Avan') },
        { value: t('Davtashen'), label: t('Davtashen') },
        { value: t('Erebuni'), label: t('Erebuni') },
        { value: t('Kentron'), label: t('Kentron') },
        { value: t('Malatyia-Sebastiya'), label: t('Malatyia-Sebastiya') },
        { value: t('Nor Norq'), label: t('Nor Norq') },
        { value: t('Norq-Marash'), label: t('Norq-Marash') },
        { value: t('Nubarashen'), label: t('Nubarashen') },
        { value: t('Shengavit'), label: t('Shengavit') },
        { value: t('Vahakni Dzor'), label: t('Vahakni Dzor') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Aragatsotn'),
      label: t('Aragatsotn'),
      tumanlar: [
        { value: t('Aparan'), label: t('Aparan') },
        { value: t('Aragats'), label: t('Aragats') },
        { value: t('Ashtarak'), label: t('Ashtarak') },
        { value: t('Talin'), label: t('Talin') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Ararat'),
      label: t('Ararat'),
      tumanlar: [
        { value: t('Ararat'), label: t('Ararat') },
        { value: t('Artashat'), label: t('Artashat') },
        { value: t('Masis'), label: t('Masis') },
        { value: t('Vedi'), label: t('Vedi') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Armavir'),
      label: t('Armavir'),
      tumanlar: [
        { value: t('Armavir'), label: t('Armavir') },
        { value: t('Ejmiatsin'), label: t('Ejmiatsin') },
        { value: t('Metsamor'), label: t('Metsamor') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Gegharkunik'),
      label: t('Gegharkunik'),
      tumanlar: [
        { value: t('Gavar'), label: t('Gavar') },
        { value: t('Martuni'), label: t('Martuni') },
        { value: t('Sevan'), label: t('Sevan') },
        { value: t('Vardenis'), label: t('Vardenis') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Lori'),
      label: t('Lori'),
      tumanlar: [
        { value: t('Alaverdi'), label: t('Alaverdi') },
        { value: t('Stepanavan'), label: t('Stepanavan') },
        { value: t('Tashir'), label: t('Tashir') },
        { value: t('Vanadzor'), label: t('Vanadzor') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Kotayk'),
      label: t('Kotayk'),
      tumanlar: [
        { value: t('Abovyan'), label: t('Abovyan') },
        { value: t('Hrazdan'), label: t('Hrazdan') },
        { value: t('Charentsavan'), label: t('Charentsavan') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Shirak'),
      label: t('Shirak'),
      tumanlar: [
        { value: t('Artik'), label: t('Artik') },
        { value: t('Gyumri'), label: t('Gyumri') },
        { value: t('Maralik'), label: t('Maralik') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Syunik'),
      label: t('Syunik'),
      tumanlar: [
        { value: t('Agarak'), label: t('Agarak') },
        { value: t('Goris'), label: t('Goris') },
        { value: t('Kapan'), label: t('Kapan') },
        { value: t('Meghri'), label: t('Meghri') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Vayots Dzor'),
      label: t('Vayots Dzor'),
      tumanlar: [
        { value: t('Jermuk'), label: t('Jermuk') },
        { value: t('Vayk'), label: t('Vayk') },
        { value: t('Yeghegnadzor'), label: t('Yeghegnadzor') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
    {
      value: t('Tavush'),
      label: t('Tavush'),
      tumanlar: [
        { value: t('Dilijan'), label: t('Dilijan') },
        { value: t('Ijevan'), label: t('Ijevan') },
        { value: t('Noyemberyan'), label: t('Noyemberyan') },
        { value: t('Boshqa'), label: t('Boshqa') },
      ],
    },
  ],
}

// ─── Republic options ─────────────────────────────────────────────────────────
// key  → LOCATION_DATA lookup uchun (ichki ishlatish)
// label → ko'rsatish uchun
// value → backendga yuboriladigan to'g'ri nom
const republicOptions = [
  { key: 'ozbekiston', label: t("O'zbekiston"), value: t("O'zbekiston") },
  { key: 'qozogiston', label: t("Qozog'iston"), value: t("Qozog'iston") },
  { key: 'tojikiston', label: t('Tojikiston'), value: t('Tojikiston') },
  { key: 'turkmaniston', label: t('Turkmaniston'), value: t('Turkmaniston') },
  { key: 'qizgiziston', label: t("Qirg'iziston"), value: t("Qirg'iziston") },
  { key: 'afgoniston', label: t("Afg'oniston"), value: t("Afg'oniston") },
  { key: 'azarbayjon', label: t('Azarbayjon'), value: t('Azarbayjon') },
  { key: 'eron', label: t('Eron'), value: t('Eron') },
  { key: 'pokiston', label: t('Pokiston'), value: t('Pokiston') },
  { key: 'armeniya', label: t('Armeniya'), value: t('Armeniya') },
  { key: 'boshqa', label: t('Boshqa'), value: t('Boshqa') },
]

// ─── Computed cascading options ───────────────────────────────────────────────
const availableViloyatlar = computed(() => {
  const republic = form.republic
  if (!republic) return []
  if (republic === 'boshqa') {
    return form.otherrepublic ? [{ value: 'boshqa', label: t('Boshqa') }] : []
  }
  const viloyatlar = LOCATION_DATA[republic] || []
  return [
    ...viloyatlar.map((v) => ({ value: v.value, label: v.label })),
    { value: 'boshqa', label: t('Boshqa') },
  ]
})

const availableShaharTumanlar = computed(() => {
  const republic = form.republic
  const viloyat = form.viloyat
  if (!republic || !viloyat) return []
  if (viloyat === 'boshqa') {
    return form.otherviloyat ? [{ value: 'boshqa', label: t('Boshqa') }] : []
  }
  if (republic === 'boshqa') return []
  const viloyatlar = LOCATION_DATA[republic] || []
  const found = viloyatlar.find((v) => v.value === viloyat)
  if (!found) return []
  return found.tumanlar.map((item) => ({
    ...item,
    value: item.value === t('Boshqa') ? 'boshqa' : item.value,
  }))
})

// ─── Cascade reset handlers ───────────────────────────────────────────────────
const onRepublicChange = () => {
  form.viloyat = ''
  form.otherviloyat = ''
  form.shahar_tuman = ''
  form.other_shahar_tuman = ''
  form.otherrepublic = ''
}

const onViloyatChange = () => {
  form.shahar_tuman = ''
  form.other_shahar_tuman = ''
  form.otherviloyat = ''
}

const onShaharTumanChange = () => {
  form.other_shahar_tuman = ''
}

// ─── Validation messages ──────────────────────────────────────────────────────
const messages = {
  uz: {
    republic: 'Iltimos respublikani tanlang',
    otherrepublic: 'Iltimos respublikani kiriting',
    viloyat: 'Iltimos viloyatni tanlang',
    otherviloyat: 'Iltimos viloyatni kiriting',
    shahar_tuman: 'Iltimos shahar/tumanni tanlang',
    other_shahar_tuman: 'Iltimos shahar/tuman nomini kiriting',
    mijozturi: 'Iltimos mijoz turini tanlang',
    phone_number: 'Iltimos telefon raqamni kiriting',
    fullname: 'Iltimos ism familiyani kiriting',
  },
  ru: {
    republic: 'Пожалуйста, выберите республику',
    otherrepublic: 'Пожалуйста, введите республику',
    viloyat: 'Пожалуйста, выберите область',
    otherviloyat: 'Пожалуйста, введите область',
    shahar_tuman: 'Пожалуйста, выберите город/район',
    other_shahar_tuman: 'Пожалуйста, введите название города/района',
    mijozturi: 'Пожалуйста, выберите тип клиента',
    phone_number: 'Пожалуйста, введите номер телефона',
    fullname: 'Пожалуйста, введите имя и фамилию',
  },
}

// ─── Validation rules ─────────────────────────────────────────────────────────
const rules = computed(() => ({
  republic: [
    {
      required: true,
      message: messages[lang]?.republic || messages.uz.republic,
      trigger: 'change',
    },
    {
      validator: (rule, value, callback) => {
        if (value === 'boshqa' && !form.otherrepublic) {
          callback(new Error(messages[lang]?.otherrepublic || messages.uz.otherrepublic))
        } else callback()
      },
      trigger: 'change',
    },
  ],
  viloyat: [
    { required: true, message: messages[lang]?.viloyat || messages.uz.viloyat, trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value === 'boshqa' && !form.otherviloyat) {
          callback(new Error(messages[lang]?.otherviloyat || messages.uz.otherviloyat))
        } else callback()
      },
      trigger: 'change',
    },
  ],
  shahar_tuman: [
    {
      required: true,
      message: messages[lang]?.shahar_tuman || messages.uz.shahar_tuman,
      trigger: 'change',
    },
    {
      validator: (rule, value, callback) => {
        if (value === 'boshqa' && !form.other_shahar_tuman) {
          callback(new Error(messages[lang]?.other_shahar_tuman || messages.uz.other_shahar_tuman))
        } else callback()
      },
      trigger: 'change',
    },
  ],
  mijozturi: [
    {
      required: true,
      message: messages[lang]?.mijozturi || messages.uz.mijozturi,
      trigger: 'change',
    },
  ],
  phone_number: [
    {
      required: true,
      message: messages[lang]?.phone_number || messages.uz.phone_number,
      trigger: 'blur',
    },
  ],
  fullname: [
    { required: true, message: messages[lang]?.fullname || messages.uz.fullname, trigger: 'blur' },
  ],
}))

// ─── Payload builder ──────────────────────────────────────────────────────────
// republic uchun to'g'ri translated nomni olamiz (key emas, value)
const getRepublicValue = (key) => {
  if (!key || key === 'boshqa') return null
  const found = republicOptions.find((r) => r.key === key)
  return found ? found.value : key
}

const MIJOZ_TURI_MAP = {
  yuridik: t('yuridikShaxs'),
  jismoniy: t('jismoniyShaxs'),
}

const createMijozPayload = (obj) => ({
  republic: obj.republic === 'boshqa' ? obj.otherrepublic : getRepublicValue(obj.republic),
  viloyat: obj.viloyat === 'boshqa' ? obj.otherviloyat : obj.viloyat,
  shahar_tuman: obj.shahar_tuman === 'boshqa' ? obj.other_shahar_tuman : obj.shahar_tuman,
  mijozturi: MIJOZ_TURI_MAP[obj.mijozturi] || obj.mijozturi,
  inn: obj.inn,
  phone_number: obj.phone_number,
  additional_phone_number: obj.additional_phone_number,
  fullname: obj.fullname,
  partner_type: localStorage.getItem('mijozTur'),
  user_id: Number(localStorage.getItem('userid')),
})

// ─── Submit ───────────────────────────────────────────────────────────────────
const onSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    const mainPayload = createMijozPayload(form)
    console.log('Creating partner with payload:', mainPayload)
    await partnersStore.createPartner(mainPayload)
    ElMessage.success("Barcha ma'lumotlar muvaffaqiyatli saqlandi!")
    router.push('/')
  } catch (error) {
    if (error !== false) {
      ElMessage.error(
        'Xatolik yuz berdi: ' + (error.message || "Iltimos, qaytadan urinib ko'ring."),
      )
      console.error('Error saving objects:', error)
    }
  } finally {
    loading.value = false
  }
}

const goback = () => router.push('/')
</script>

<style scoped lang="scss">
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 40px;

  @media (max-width: 768px) {
    padding: 12px;
    padding-bottom: 24px;
  }
  @media (max-width: 480px) {
    padding: 8px;
    padding-bottom: 20px;
  }
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
  margin-bottom: 18px;
  padding: 0 8px;

  @media (max-width: 768px) {
    margin-bottom: 14px;
    padding: 0 4px;
  }
  @media (max-width: 480px) {
    margin-bottom: 12px;
    padding: 0 2px;
  }

  .el-icon {
    font-size: 22px;
    color: #222;
    cursor: pointer;
    flex-shrink: 0;

    @media (max-width: 768px) {
      font-size: 20px;
    }
    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  h2 {
    margin: 0;
    color: #222;
    font-weight: 600;
    letter-spacing: 0.5px;
    font-size: 22px;
    line-height: 1;
    text-align: center;
    flex-grow: 1;

    @media (max-width: 768px) {
      font-size: 20px;
    }
    @media (max-width: 480px) {
      font-size: 18px;
      letter-spacing: 0.3px;
    }
    @media (max-width: 380px) {
      font-size: 16px;
    }
  }
}

.form {
  background: #fff;
  padding: 32px 40px 24px 40px;
  border-radius: 12px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.07);
  width: 100%;
  max-width: 600px;

  @media (max-width: 768px) {
    padding: 24px 20px 18px 20px;
    border-radius: 10px;
  }
  @media (max-width: 480px) {
    padding: 20px 16px 16px 16px;
    border-radius: 8px;
  }
}

.button-group-container {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  width: 100%;
  max-width: 600px;
  padding: 0 40px;

  @media (max-width: 768px) {
    padding: 0 20px;
    margin-top: 20px;
    gap: 10px;
  }
  @media (max-width: 480px) {
    padding: 0 16px;
    margin-top: 16px;
    gap: 8px;
    justify-content: center;

    .el-button {
      flex: 1;
      max-width: 150px;
    }
  }
}

.el-form-item {
  margin-bottom: 22px;

  @media (max-width: 768px) {
    margin-bottom: 18px;
  }
  @media (max-width: 480px) {
    margin-bottom: 16px;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.whereotherinput {
  padding-top: 5px;
}

.full-width-select {
  width: 100%;
}

.full-width-input {
  width: 100%;

  @media (min-width: 769px) {
    max-width: 240px;
  }
}

.responsive-radio-group {
  display: flex;
  flex-direction: row;
  gap: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
}

:deep(.el-form-item__label) {
  @media (max-width: 768px) {
    width: 100% !important;
    text-align: left !important;
    margin-bottom: 8px;
  }
}

:deep(.el-form-item__content) {
  @media (max-width: 768px) {
    margin-left: 0 !important;
    width: 100%;
  }
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-form-item) {
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
  }
}

:deep(.el-radio) {
  @media (max-width: 480px) {
    margin-right: 0;
    display: flex;
    align-items: center;
  }
}

:deep(.el-radio__label) {
  @media (max-width: 480px) {
    font-size: 14px;
  }
}
</style>
