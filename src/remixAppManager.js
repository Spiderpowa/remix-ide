/* global localStorage */
import { PluginEngine, IframePlugin } from '@remixproject/engine'
import { EventEmitter } from 'events'
import { PermissionHandler } from './app/ui/persmission-handler'

const requiredModules = [ // services + layout views + system views
  'compilerArtefacts', 'compilerMetadata', 'contextualListener', 'editor', 'offsetToLineColumnConverter', 'network', 'theme', 'fileManager', 'contentImport',
  'mainPanel', 'hiddenPanel', 'sidePanel', 'menuicons', 'fileExplorers',
  'terminal', 'settings', 'pluginManager']

const settings = {
  permissionHandler: new PermissionHandler(),
  autoActivate: false,
  natives: ['vyper', 'workshops', 'ethdoc', 'tangerineGarden'] // Force iframe plugin to be seen as native
}

export class RemixAppManager extends PluginEngine {

  constructor (plugins) {
    super(plugins, settings)
    this.event = new EventEmitter()
    this.registered = {}
  }

  onActivated (plugin) {
    localStorage.setItem('workspace', JSON.stringify(this.actives))
    this.event.emit('activate', plugin.name)
  }

  getAll () {
    return Object.keys(this.registered).map((p) => {
      return this.registered[p]
    })
  }

  getOne (name) {
    return this.registered[name]
  }

  getIds () {
    return Object.keys(this.registered)
  }

  onDeactivated (plugin) {
    localStorage.setItem('workspace', JSON.stringify(this.actives))
    this.event.emit('deactivate', plugin.name)
  }

  onRegistration (plugin) {
    if (!this.registered) this.registered = {}
    this.registered[plugin.name] = plugin
    this.event.emit('added', plugin.name)
  }

  // TODO check whether this can be removed
  ensureActivated (apiName) {
    if (!this.isActive(apiName)) this.activateOne(apiName)
    this.event.emit('ensureActivated', apiName)
  }

  // TODO check whether this can be removed
  ensureDeactivated (apiName) {
    if (this.isActive(apiName)) this.deactivateOne(apiName)
    this.event.emit('ensureDeactivated', apiName)
  }

  deactivateOne (name) {
    if (requiredModules.includes(name)) return
    super.deactivateOne(name)
  }

  isRequired (name) {
    return requiredModules.includes(name)
  }

  registeredPlugins () {
    const vyper = {
      name: 'vyper',
      displayName: 'Vyper',
      events: ['compilationFinished'],
      methods: [],
      notifications: {
        'fileManager': ['currentFileChanged']
      },
      url: 'https://remix-vyper-plugin.surge.sh',
      description: 'Compile vyper contracts',
      kind: 'compiler',
      icon: 'data:image/svg+xml;base64,PHN2ZyBpZD0iRmxhdF9Mb2dvIiBkYXRhLW5hbWU9IkZsYXQgTG9nbyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjA0OCAxNzczLjYyIj4gIDx0aXRsZT52eXBlci1sb2dvLWZsYXQ8L3RpdGxlPiAgPHBvbHlsaW5lIHBvaW50cz0iMTAyNCA4ODYuODEgNzY4IDEzMzAuMjIgMTAyNCAxNzczLjYyIDEyODAgMTMzMC4yMiAxMDI0IDg4Ni44MSIgc3R5bGU9ImZpbGw6IzMzMyIvPiAgPHBvbHlsaW5lIHBvaW50cz0iMTI4MCA0NDMuNDEgMTAyNCA4ODYuODEgMTI4MCAxMzMwLjIyIDE1MzYgODg2LjgxIDEyODAgNDQzLjQxIiBzdHlsZT0iZmlsbDojNjY2Ii8+ICA8cG9seWxpbmUgcG9pbnRzPSI3NjggNDQzLjQxIDUxMiA4ODYuODEgNzY4IDEzMzAuMjIgMTAyNCA4ODYuODEgNzY4IDQ0My40MSIgc3R5bGU9ImZpbGw6IzY2NiIvPiAgPHBvbHlsaW5lIHBvaW50cz0iMTUzNiAwIDEyODAgNDQzLjQxIDE1MzYgODg2LjgxIDE3OTIgNDQzLjQxIDE1MzYgMCIgc3R5bGU9ImZpbGw6IzhjOGM4YyIvPiAgPHBvbHlsaW5lIHBvaW50cz0iMTE1MiAyMjEuNyA4OTYgMjIxLjcgNzY4IDQ0My40MSAxMDI0IDg4Ni44MSAxMjgwIDQ0My40MSAxMTUyIDIyMS43IiBzdHlsZT0iZmlsbDojOGM4YzhjIi8+ICA8cG9seWxpbmUgcG9pbnRzPSI1MTIgMCAyNTYgNDQzLjQxIDUxMiA4ODYuODEgNzY4IDQ0My40MSA1MTIgMCIgc3R5bGU9ImZpbGw6IzhjOGM4YyIvPiAgPHBvbHlsaW5lIHBvaW50cz0iMjA0OCAwIDE1MzYgMCAxNzkyIDQ0My40IDIwNDggMCIgc3R5bGU9ImZpbGw6I2IyYjJiMiIvPiAgPHBvbHlsaW5lIHBvaW50cz0iNTEyIDAgMCAwIDI1NiA0NDMuNCA1MTIgMCIgc3R5bGU9ImZpbGw6I2IyYjJiMiIvPjwvc3ZnPg==',
      location: 'sidePanel'
    }
    const pipeline = {
      name: 'pipeline',
      displayName: 'Pipeline',
      events: [],
      methods: [],
      notifications: {
        'solidity': ['compilationFinished']
      },
      url: 'https://pipeline-alpha.pipeos.one',
      description: 'Visual IDE for contracts and dapps',
      icon: 'data:image/png;base64,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',
      location: 'mainPanel'
    }
    const tangerineGarden = {
      name: 'tangerineGarden',
      displayName: 'Tangerine Garden - Contract verification',
      events: [],
      methods: [],
      notifications: {
        'solidity': ['compilationFinished']
      },
      url: 'https://remix-tangerine-garden-plugin.surge.sh',
      description: 'Verify Solidity contract code using Tangerine Garden API',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPEAAAD5CAYAAAD2mNNkAAAAAXNSR0IArs4c6QAAHL1JREFUeAHtnQm0JUV5x98oqKAgskQ2h5kRFBRRAQ3I4hzABAWEyCaCLBoBE9coniiCAQ0GBQSJiCJkAPWogEjcGBRmGINxXFgFiYjICHhYZwAdlhmc/P6P22/63Xe37tvVXX37X+d8r7qrq776vn/V/1V1dXXfsTGHjgisWLFiN2R6x4tONAJGIG4EIO+6yKPIX5GrkMOQ58Vtta0zAkZgAgEI+1mkPYjUn0FeOJHRB0bACMSHACRdH1mKdAuPceFM5EXxWW+LjIARGIOcn+/G3rb0Jzg/CVndsBkBIxAJAhDyRcjjSJbwBzK/ORIXbIYRaDYCkFEja95wGQXXazaC9t4IVIgABJyG3JmXwa1ydxPvVKEbrtoINBcByDd7SAInxZdz8DFkWnPRtOdGoAIEIN25CQsLii9Bz7MrcMVVGoHmIQDZnoE8VBB502rmcbJm8xC1x2Ui4CkfaEO0VxFdFwj469G7+7Rp0+4NpL9yteCnx2xbIpsgM5B1keXIspbcRfw7ySjjgH+VhFUqqTW+Sl8f0CT9g5hPR9+RDvxgwHpKVY0/2rn2NuSNyM7IQLcOlHuYvNcg85GrkV+By1PEDkYgPwJ0rEuR0OFnVFD7jSH4MAv5IqKda0WEh1HyNWQv5Fn5W9ElG40Anec+pIzwAyqp5ewHu5+JaNVdO9VChcUoPg/ZpdEd0s5nQ4AOs1aoHtlF79nZLKw+N37MRDSTKDPcTGX/hPjtseq7QNwW0Em2LbNntuo6KG5UVlqHvVsh91SAUVKlptunIy9eaZWPjEAKATrHW5PeUmL8CHVtljIjykNs3B7RFDeGoE005yPR41Z2Yz6j7AojrG9WBTatQZ3fokNGu5CDbZti43eRtSrAp1OVzyTxUOQ32HYh8tJOmZqYZhKPjT2/oobXo6ePVFR3z2ohyAvI8D1knZ4Zq7koMh+C3IKdX0VmVGNGPLWaxGNjVT720WrvzHi6w4QlcziKfaRT3z0YuRUMT0YauzPOJB4bW42OUFVQ3WdWVXmneiHDYaTX6f1obTLRjOZ32K7V7Fo+wuvUFoOmmcTVjsRqpz3oeG8atMFC5sMOfXLojJB1BNStd7m/gNyIH28IWE90qk3isbEnI2iVT0Rgg0z4LFLVGkFREGyBoisgsha/GvGRBpN4bGxJUb1nCD2vrXr0oP7tsP/AIXyIragWv3S/fERshhVtj0kcB4nVrh8vunEz6jstY/46ZF8bI7WNcx4yss+XTeKxscWR9Mad6WivqcIW6t2Derevou6S6pxNPdfhp54zj1wwicfG/hRRq1Y19ftoRBiEMuW5KNaOL4mORyZMGxlPcjpCg+pl9ptyFi+6mGYFG/B+7RNFK+6mD//1Yb8F3a6PaPqt+HUgON84Cv55JB4b+y0NuTySxtROqb1KtuWYkuuLobrNMWIh/8COjsGYYW1oPIn5b6xHTLcPC2SB5UtbIaYTT8du3Q83MTwHp/VxA+1hr/VjtcaTuNV7r4+oF+9CpyqrXY7E77LqigjiSabsz5kWvSpZVJxkSc6TpjdgAtuVyUEEsR6LbB3aDjrtqtTxztD11ES/9q9fAyb/gtRuncgkfrqX/TiyzrZbCfZoq+f6JdRTlyr0T+1U5OsQOdpXRDuBaRKDCvfFdxD9vhNAFaXtXEK92tHkMBWBt5L0fYhcm88CmcQrG/GHKw8rP3p5SAvooFrIKXsVPKRLRevWTGgeOK1XtOIQ+kzilaheuPKw8qPpgUcCLeboFT6H7ghsyyXdJ8/oniWOKyZxqx2YUi/kUJsAYgl6GydUKO0xVigHStKr/dY/hchblVRfrmpM4smwnT/5tNKzIF/WoENq9Xt2pZ7Vq/INMHcBuJWxTpELGZN4MmwXcBrD+8WyKtT3rfZGd+O+fiFAhwhaQ5gLkfcZQkewoiZxClqm1PdwOieVVOXhWoEq3zeQ3lFXqx1eF0Pkd8XmqEk8tUX+g6QY9lJrH3WhgQ6ot3fKeAZdqN0RKdOXNr8Mjh+IyKbGb7mb0hatZ8Zfn3Kh/IQQ+3lFYK9KD9+Wp0HkfxxeTTEaPBJ3xvFEkkt7HbCzCWNPdUkfJjmKD/IN40AkZbU180sQWRtDKg8mcYcmYDTWW02aVlcZlgao3CQuDlRxRx/jq3zTjEncvVFF4ipfUXysu2nZr9DZ9Kxz4+wlXaIHAlrl16uMs3vkCX7JJO4CMaPx41x6T5fLZSQXPRI39b3h0G2lVetLIfLmoSvqpt8k7oYM6RD5cqIv9sgS8tK9BSv3VLpgQFPq9DhQL01UstfaJE61RJfDD5J+fZdrIZN/V5RyOpceV21flD7r6YjALFIvA2uNzKUGk7gP3IzGWqU+AHm0T9aiLxdGYgz7e0TPOB3CIqB/lPqaZqkfFjCJB2hUiHwb2Q5H/jpA9iKyaOvnoiIUtXR4Kl0gmH1U6R/+sX3yFHrZJB4QToj8bbK+d8Dsw2b7DfUV+Q/Du7SGbZFs5U9gNH5DtiL5c5vEGbCDWGeR/ZMZiuTNenXegu3l6Ez6rvYG7ek+D4qAeKXP/EwPWktLuUmcEWWIfDxFROaQYX6Byv+uQF1WNTgC65L1Iogc/HtdJvHgjTKREyL/Myf/PpFQ7MEK1C0oUGVp07oCbR4VVa/FkdNDO1PqKlpoZ8rWz39Z3SOfgRSJ47X8k9imCF+wTy87PISsXoQ+68iNwD606WW5S/cp6JG4D0C9LtMwZ3L9IGRpr3wZrxX5BtUO1G0CZ2yAANnP4R/qCwPoHVdpEg+JLET+Jir06wE3D6lKxbUiXSSJfT9cQKMUoEI7uc4rQE9HFSZxR1iyJULkWyih+5852UpOyf1jdP1pSmr+BN8P58eu6JJvYjR+d9FKpc8kLghVyLcUOQJ1ByD35FR7fs5yU4rRYbQ6+uopF5xQJQKn0C6bFW1AkQsyA9uGI/pqxa7IS5FZiF6R0z8UvQivbY6LEL0GqJ1SCyGHFmdqE/BvDYw9AXkfMuh2R/m6Bb4Kg6EDNuhevcip+dA2WcE4AvNo412KxKI0EtOpVsPwIxCNVFpw0buYgwQ9crkJWYD8NyIQlhNHH/B5K4w8BRlkWnswfhVGOur+L+o9HHGID4EjaOs5RZkVnMR0Jv2mjUYkfVysiFe1HkDPJciFAHENcfQBDHS//HFkT6QT5reQ/gr80cJWIYE670bRhoUos5KiEXgQhZvT3urLQ4dOHWpopYkCOtJsjjUizEBChBtQehbyNQD5S4gKitQJHhqZP4zsi6Qf/eyP/RcXVRf1bIkuzV4c4kVAg9ChRZgXhMR0Ik2VT0E0Agepo835JZzrme3pAPNQ27XoTsFH98z7IYchOt4Wu3XbUEhA/4dQJPwd4kZgV9r9qmFNLJxgdCB92/gi5I3DGpej/J8poy9xnAI49+UoX3oR8FoVW5cVWTE656LPz4iLBDWMLs2WXk37D7WYWSiJ6Tx6rPF9RPeAVQaR+VQJAD1apSFl100b6MsSi5HSvzBRtq8jUt+R9NFzhvGlMBLTeTQCawV562EMKrjs/ejTq4NnFz3aFWxnYepoB43AGokd6oHAvZi52TCDzTOK8JOOo2eh30RiIrBc02r455EbsXF3JTQg6FM8DvVBQHuqPzqMuYWMxBBE96FHD2NISWU11f8g//W0sWIkA22h+yytTjvUBwF9Hvml9MtFeUweeiSm0xxMxXUgsPDZA/k1NuvzKXpNb6QCPmnnmwlcv1bV+oX2EeQKQ5GYTrMJtX4hV83VFXoWVR+P3IT9u1RnRpCa9wyi1UrLQOBw+uOMPBXlJjEVquwFSIhf78vjS9Yy2oh+JX5cgOjeeRTCXqPgREN9WBW/j83je+57Yjr+B6nwtDyVRlhGG0Q+gpzHfUlhmy7K9JP20A6wBxFNzRzqicAyzNa98R1ZzM81EtNhtKL2b1kqijzv2tj3FeRqfHtZ5LZ2M283LpjA3dCpR3qu0TgXicHjJGTNeuCSycqdyH0dRD4OEaB1Cr4frlNrdbf1UPreBt0vT72SmcRUsC1qjpiqamRStPB1IvJLfN2mDl5hp26LTOI6NFZ/GzV4vKd/tpU5MpOYovoEZ+576ZVVR3+0FRYuhCAnI7FPU/XPJtN/7+jRb7aBR9Hn0m+59UQjE4lRrPuuHXpqHK2L2ommBa8b8F1T7ViDR+FYWyafXetQbODXFDORGMXH5bOp9qVeggda9PpP5HkReuNHSxE2ypAmfYC+NtCMd6BMMgaFryear+OGh0X4fxSPAfQD5JUH2mUjjLirckNsQAgEdqef9X2ZJctI3NRRuL1xppPwQ8hzPqJHU1WHfao2wPUHQ+Cdg2geaCSms2pF+heDKGxYHr1G9l7+W15Uld+0zQLqjvl+vSpoRqFe/U71RvSvB3o5M+hInGnJu1eFI3ZNm16+BZEuRUpfHaZOTaV3HDFM7c5KBPS485CVp52P+pKYjqKVsgM7F3dqCwFNaW8Bq3eUjMgB1DfQbKpku1xdcQj0nVL3JTG2qGPG/py0OMjya1qLoudC5B8hM/OryVTyrZlyO3MdEdiS/tTzc1c9SUxhXX93HT2v0GY9S9c7y8cgq4SyA936R9GzcUPVbb2lI9Dzn3VPEmPq7khZo0rpyASsULttPoNcC9m2D1SPb3ECARuh2v3oR11vm/qR+LAIHaqTSa/A2GtogLMRTbeLDCZxkWjGretFmLddNxO7kphOtwaFvBOoG3KDp+s/6FHIrWD6tsGLdc+JHv0Q3au65/CVEURg/24+dSUxBd6CrNatoNMzI6DHUV+DgFr42ixz6ckFPApPxqMJZ12n1L1IfHATkKnARy186RO6xyN6Dpgn9FzoyKPQZaJHQFPqjq/GdiQxnWt9CuwSvVv1NVCP7E5AbgbrvbO4Qf6tyb9FljLOOzIIaKF5SuhIYnJpE4Few3MIi8CmqP8OxNQH+/T+8iBB99cOzUSgI4k7LlvToX4ERpr2OZSHwFNUpe98HcdeWf38zJRAu2ix8R4kxtchp9jrhMIRUB9Zh/7xcFrzlJGYjqIOsnM6k49LQUAzH42yt9EGH0Y63S9rddsELqU5oqxEfWTK4DqFxGR6A9KpA0Xp1Qgape94fxbpdL989Aj6a5eyITBlSt2JxHtk0+ncgRBI3y+/ipFZWyz9bDgQ2DVSq49zTAqT7onpKDq/Gyn9tbpJVvmkHYEVJNyJzGi/4PNGIvA36XWT9pH4lUBiAsfXL/TPdUZ8ZtmiihB4XbredhLvlL7oYyNgBKJEYIe0Ve0k9lci0uj42AjEicAkEmuaNhG4J76Lk40mEnxgBIxAjAg8gVFrcF+8TMZNjMQQeCbnJrBQcTACcSPwbMyb2Ho7QWISPZWOu+FsnRFIIzCxTTdN4q4vHadL+tgIGIEoENAHJ8ZDmsQTzE4uOjYCRiBaBCb4mibxltGaa8OMgBFoR2AyiVnU0k+TFP0NqPZKfW4EjEBxCGwIb8c5m4zEE/Pr4uqwJiNgBAIjoCdKE4+YTOLAaFu9EQiAwCzpTEbiiWdOASqySiNgBMIgMGkknhGmDms1AkYgIAKTSLxJwIqs2ggYgTAIPE1iVrhWQf/GYeqwViNgBAIiMM5b3RNrv7S/bBkQaas2AoEQWE96RWJPpQMhbLVGIDAC60q/SLxh4Iqs3ggYgTAIrKINHyLx2mH0W6sRMAIlILCeSVwCyq7CCAREwCQOCK5VG4EyEFjDI3EZMLsOIxAOgeeIxC8Ip9+ajYARCIzAaiKxf9snMMpWbwQCIjA+EmvHloMRMAL1RGCcxKvW03ZbbQSMAAh4JHY3MAI1R2CF7ok9Ete8FW1+oxFYLhL7nrjRfcDO1xyBcRI/VXMnbL4RaDIC4yR+rMkI2HcjUHMExkn8eM2dsPlGoMkILNM9sUfiJncB+153BB4WiT0S170ZbX+TEVjikbjJzW/fRwGBxSLx4lHwxD4YgYYiME7i+xvqvN02AqOAwPh0+r5R8MQ+GIEGIvD4tGnTHtN02iNxA1vfLo8EAnfJC5N4JNrSTjQUgT/Kb5HY0+mG9gC7XXsEFskDkfjO2rtiB4xAMxF4eiTmxngp/t/bTAzstRGoNQITI7G8uL3Wrth4I9BMBMZn0ZpOK/z+6ch/jYARqBECv5GtJnGNWsymGoEUAo9yKzyxOq10T6dT6PjQCNQAgVsSG5OR+MYkwbERMAK1QGAKiZWwvBam20gjYASEwM0JDOMjMXPrJ0m4NUl0bASMQPQI3JRYmEynde4pdYKKYyMQNwIrMO/niYlpEt+QJDo2AkYgagT+j9nzksTCNImvTRIdGwEjEDUCC9PWpUn8My74G9RpdHxsBOJEQFydCBMkZnj+M6meUk9A4wMjEC0CnUncMveaaM22YUbACAiBR5CJlWklTIzEOiGYxE/j4L9GIFYE5jFrnnTbaxLH2lS2ywh0RuCK9uRJJIbh+mbPb9sz+dwIGIFoEPhRuyWTSNy6eHl7Jp8bASMQBQJ3MtDe1m6JSdyOiM+NQLwITBmFZWonEs8n3b/PJHQcjEBcCHyvkzlTSMxwrV9J/EmnzE4zAkagMgS0j2Nup9qnkLiV6QedMjvNCBiByhD4AQNsxxlyNxJ/uzJTXbERMAKdELi4U6LSpnW7sGLFCm3t+ttu151uBIxAaQjoFnc9RuK/dKqx20isvF2Z30mR04yAEQiGwNxuBFaNJnEw3K3YCBSGwIW9NHWdTqsQU2p9PeA1vRT4mhEwAkEReADtGzISL+tWS6+RWGW+3q2g042AESgFgQt7EVgW9BuJ1yXP3cizlNnBCBiB0hHYChJPevWw3YKeIzGFNZR/t72Qz42AESgFgWv7EVhW9CRxy8zzSjHXlRgBI9COwDntCZ3Oe06nVYDFrWcSLUI21LmDETACpSDwKLVswEjc8dlw2oK+IzFK9BWBOelCPjYCRiA4AmcNQmBZ0XckViZG442J7kBW0bmDETACQRHQwDkDEusjHX1D35FYGlrKLumrzRmMgBEoAoFLBiWwKhuIxC2rzijCOuswAkagLwKn9s2RyjDQdDrJ7x1cCRKOjUAwBBYyCm+XRXuWkVh6T8+i3HmNgBHIjMC/Zi2RdSTW4yb9lvFLslbk/EbACPRF4OeMwplf/800ElOBVs0+0dcUZzACRiAPAsfkKZRpJFYF3BeL+Ncjr9C5gxEwAoUgkPleOKk100isQozGfyU6PlHg2AgYgUIQ+HBeLZlH4qQiRuRfcrxNcu7YCBiB3AhcxeC4a97Sw5B4dyr9Yd6KXc4IGIFxBDSz3RwST/llh0HxyTydThRT6eUc+1cUE0AcG4F8CHx5GAKrytwjsQozpZ5NNE/HDkbACGRGQG8obQyJl2QumSqQeySWDiqfT3Sljh2MgBHIjMCxwxJYNQ41EksBo/H2RD/VsYMRMAIDI/AHcm4GiZcPXKJLxqFGYunEiP8l+kYX/U42AkZgKgIrSDqgCAJL9dAkbtn3fuLFrWNHRsAI9EbgKxD4F72zDH516Ol0UhXT6ndwfG5y7tgIGIGOCDxI6iaQuO9ndzqW7pBY1EisabU+qDe/Qx1OMgJGYCUCby+SwFJb2EgsZYzGervpRuTZOncwAkZgEgKXQeB9JqUUcFLYSCxbMPC3RJ8qwC6rMAKjhsC9OPT2EE4VOhLLQEbjVYmuQ16ucwcjYATGngKDbRjkbgiBRaEjsQzEUP3w05GIltEdjIARGBs7JhSBBW7hJJZSDNbmj7N17GAEGo7AlfDhcyExKHw6nRjLtHpNjvUpn42SNMdGoGEI6HHSTEisX3MIFoKMxLIWwx8hOggZeluZ9DkYgZohoPvg3UITWJgEI7GU48BPiD6mYwcj0DAEPkT/12esgodg0+m05Uytv8P53uk0HxuBEUbgexB4r7L8K4vEa+HQr5BZZTnmeoxARQjcTb1blDGNTvwLOp1OKsGhJRzvhzyepDk2AiOIwFJ8emOZBBaGpZBYFeGYNoC8T8cORmAEEdD+CBH4prJ9K43EcgwHzyG6oGwnXZ8RCIyAPna3H/17QeB6Oqov5Z44XTOLXKtzvhDZMp3uYyNQUwS0M/EdEHhOVfaXOhLLSZzVfcO+iJ4jOxiBuiPwkSoJLPBKJ7EqxWm97bQP8oTOHYxATRE4mb58StW2lz6dTjvM1PotnH8L0a8tOhiBOiFwHgR+ZwwGVzISJ44Dwrc5Pjo5d2wEaoLAZdipN/WiCJWSWAhA5K8QZf5h5SjQsxFNRGABTh9Iv9Xe6ChC5SQWCgByMtGpUSBiI4xAdwT+h0t70l+jWsup9J44jRX3x7JFH9s7PJ3uYyMQCQL68cB9IfBjkdgzYUY0JJZFEFkLXLpPfrPOHYxAJAho8fUQCKxdWdGFqEgsdCDyc4jmIjvr3MEIVIyA1myOgsDalRVliOKeOI0MYOklCb3G5V9bTAPj4yoQOIn++K6YCSxQohuJk5ZiRNa3qy9E9k/SHBuBkhB4knqOhLznl1TfUNVES2J5BZE1UzgDeY/OHYxACQg8RB1vgcBXl1BXIVVEN51Oe6VpDPJe0j6RTvexEQiEgLYDb1cnAguHqEmcNBSgnsjx+xF/yzoBxXHRCHwfhSLwbUUrDq2vFiQWCID7eSJ/lD50j2iefu28OhbZiz62uI7uR31P3AlQ7pP/gfSLED1TdjACwyBwH4UPgrxXDaOk6rK1I7EAg8ivIxLw/vVFAeKQBwFtodQe6HvyFI6pTG2m02nQAF4/E/MS5P50uo+NwAAIaNeVps+zR4HA8reWI7EMV2g9grqCw12QWvsifxyCI6CfFdL2SX20cWRCLUfiBH0aQ4+gduP8Y0i02+ISex1XhoCeapyO6OdFR4rAQnRkRi9G5W3xR3uu15ZjDkaghcCtxNr7vGBUEan1SJxuFBrpl5yvh3wT8fPkNDjNPNY7v9ok9MpRJrCadmRGYjmTBEZl3SNfiqyZpDluFAJ6cnE05K3dxo08rTQyI3HaeRpPjbg+oneTPSqnwRnt40W4dzDtv2tTCKzmHMmRON1PW/fKl5A2PZ3u45FCQD/i/Wnkc5BXr7I2KozkSJxuQRpV98ozkY8iT6av+bj2CGjL5JeQTWnnTzeRwGrBkR+J5WQSGJU35vhMZG+kUb4nGIxIrMeJWsA8EeJq9bnRoZEdGTJvQ6ufhby20a1fP+dN3g5t1kgSJzhAZv2UzGnIzCTNcZQILMcqjbyf8sg7tX0aTWLBAZH1NtTbED1TfDHiEA8C+nH6c5AzIe8f4zErLksaT+KkOSCzFvkOQI5DXpakO64EAT3f1WeZ5kDev1RiQY0qNYnbGgsyCxNNs9+HzEYcykFATw70G0fnIldAXj/fHxB3k7gHUBB6Sy7rI32HIM/tkdWX8iNwI0XPQ74KcR/Mr6a5JU3iAdoeMq9FtsOQQ5GtByjiLL0RuIPLFyPfgLjX9s7qq/0QMIn7IdR2HUJvQdLBLZnRdtmn3RG4nUsi7kUQ91fds/lKVgRM4qyItfK37p1fx+mbkT0RL4a1sGlFeotIn8C5HJkLcW9qpTsqGAGTuCBAIfVMVInMeyA7IasjTQraiPFr5GpkLjIP4i4ldgiMgEkcAGAIvSpqtStMZN6xFb+AeJTCn3HmZ4i+d3aNjiHtI8QOJSNgEpcAeGvqrQ/7vTIlIrlel4w96FHPnYg+a6OV5ERuh7R+DAQgVQeTuMIWgNwanTdFZiKzkM0Q3VtPR7QivhoSuo2WUcejyAOIVo01JVY8IZC1ca/34X9tQugOUhsgYjQUkmtL6DrIui15PvHaiMgvkiteE9H0vX1U1D2qftV+CbIYeaglOn8Y0ed+7/d9KyjUPPw/Xnp7cAsaS8YAAAAASUVORK5CYII=',
      location: 'sidePanel'
    }
    const ethdoc = {
      name: 'solidityDocMd',
      displayName: 'Solidity documentation generator',
      events: [],
      methods: [],
      notifications: {
        'solidity': ['compilationFinished']
      },
      url: 'https://remix-ethdoc-plugin.surge.sh',
      description: 'Generate Solidity documentation (as md) using Natspec',
      icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSIxMDI0IiB3aWR0aD0iMTAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOTUwLjE1NCAxOTJINzMuODQ2QzMzLjEyNyAxOTIgMCAyMjUuMTI2OTk5OTk5OTk5OTUgMCAyNjUuODQ2djQ5Mi4zMDhDMCA3OTguODc1IDMzLjEyNyA4MzIgNzMuODQ2IDgzMmg4NzYuMzA4YzQwLjcyMSAwIDczLjg0Ni0zMy4xMjUgNzMuODQ2LTczLjg0NlYyNjUuODQ2QzEwMjQgMjI1LjEyNjk5OTk5OTk5OTk1IDk5MC44NzUgMTkyIDk1MC4xNTQgMTkyek01NzYgNzAzLjg3NUw0NDggNzA0VjUxMmwtOTYgMTIzLjA3N0wyNTYgNTEydjE5MkgxMjhWMzIwaDEyOGw5NiAxMjggOTYtMTI4IDEyOC0wLjEyNVY3MDMuODc1ek03NjcuMDkxIDczNS44NzVMNjA4IDUxMmg5NlYzMjBoMTI4djE5Mmg5Nkw3NjcuMDkxIDczNS44NzV6Ii8+PC9zdmc+',
      location: 'sidePanel'
    }
    const mythx = {
      name: 'remythx',
      displayName: 'MythX Security Verification',
      events: [],
      methods: [],
      notifications: {
        'solidity': ['compilationFinished']
      },
      version: '0.1.0',
      url: 'https://remix-mythx-plugin.surge.sh',
      description: 'Perform Static and Dynamic Security Analysis using the MythX Cloud Service',
      icon: 'https://remix-mythx-plugin.surge.sh/logo.png',
      location: 'sidePanel',
      documentation: 'https://github.com/aquiladev/remix-mythx-plugin/blob/master/README.md'
    }
    const provable = {
      name: 'provable',
      displayName: 'Provable - oracle service',
      events: [],
      methods: [],
      notifications: {
        'udapp': ['newTransaction'],
        'network': ['providerChanged']
      },
      url: 'https://remix-plugin.provable.xyz',
      documentation: 'https://docs.oraclize.it/#development-tools-remix-ide-provable-plugin',
      description: 'request real-world data for your contracts',
      icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTcuNTMgMTU5Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6bm9uZTtzdHJva2U6I2IzYjNiMztzdHJva2UtbWl0ZXJsaW1pdDoxMDtzdHJva2Utd2lkdGg6OHB4O308L3N0eWxlPjwvZGVmcz48dGl0bGU+bG9nby1vdXRibGFjay1pbm5lcmdyYXk8L3RpdGxlPjxnIGlkPSJmZzEiPjxwYXRoIGQ9Ik0xNjkuMjksNjZDMTU5LjM3LDQ1LjQ5LDE0MiwyOS4xMywxMTkuNzYsMjMuMTVBNzkuMDgsNzkuMDgsMCwwLDAsNDgsMzkuNTVjLTMuNjgsMy4xMywxLjY1LDguNDIsNS4zLDUuMzFhNzEuMjYsNzEuMjYsMCwwLDEsNjUuNzgtMTQuMTFjMTkuOTIsNS43NywzNC44MywyMC42Niw0My43MiwzOSwyLjEsNC4zNSw4LjU3LjU1LDYuNDgtMy43OFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMS42NSAtMjAuNDgpIi8+PHBhdGggZD0iTTEyNiwxNzAuNDJjMTUuNzQtNi4xOSwyOS41Ny0xNi4zMSwzOC42OC0zMC43NCw5LjY5LTE1LjMyLDEzLjA3LTM0LjE0LDEwLjc5LTUyLS42LTQuNzItOC4xMS00Ljc4LTcuNSwwLDIuMDcsMTYuMjEtLjU0LDMzLTkuMDgsNDcuMTEtOCwxMy4yMS0yMC42MSwyMi43OC0zNC44OCwyOC40LTQuNDQsMS43NC0yLjUxLDksMiw3LjIzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIxLjY1IC0yMC40OCkiLz48cGF0aCBkPSJNMzQuMDgsNTUuNThjLTE1Ljc5LDI1LjQxLTE3LDU3LjQ0LTEsODMuMThBNzguMiw3OC4yLDAsMCwwLDEwMiwxNzUuNDFjNC44MS0uMTYsNC44NC03LjY2LDAtNy41LTI1LjE0LjgtNDkuMTItMTEuNDMtNjIuNDYtMzIuOTMtMTQuNjEtMjMuNTQtMTMuNDMtNTIuMzksMS03NS42MSwyLjU2LTQuMTEtMy45My03Ljg4LTYuNDctMy43OVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMS42NSAtMjAuNDgpIi8+PHBhdGggZD0iTTk4Ljg0LDQwLjg2YTU4LDU4LDAsMCwwLTQ5LDI3Ljc4Yy0xMi4xNiwyMC0xMC44NCw0My44OSwzLjM2LDYyLjQ1LDIuODksMy43OCw5LjQxLDAsNi40OC0zLjc5LTYuNTMtOC41Mi0xMS4yMS0xOC40OC0xMS0yOS40MkE1Mi4xMSw1Mi4xMSwwLDAsMSw1Ni4zLDcyLjQyLDUwLjI4LDUwLjI4LDAsMCwxLDk4Ljg0LDQ4LjM2YzQuODMtLjA2LDQuODQtNy41NiwwLTcuNVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMS42NSAtMjAuNDgpIi8+PHBhdGggZD0iTTcxLjIyLDE0OC4wNWMyMSwxMi4wOSw0OC4zMyw4LjQyLDY2LjIxLTcuODFBNTcuMjksNTcuMjksMCwwLDAsMTI0LjUsNDYuNzdjLTQuMjktMi4xOS04LjA5LDQuMjctMy43OSw2LjQ4LDI0LjYzLDEyLjYzLDM1LjM3LDQzLjMxLDIyLDY4LjEtMTIuOCwyMy44My00NCwzMy44Ni02Ny43NSwyMC4yMy00LjItMi40MS04LDQuMDctMy43OSw2LjQ3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIxLjY1IC0yMC40OCkiLz48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9Ijc3LjE5IiBjeT0iNzcuNDgiIHI9IjMzIi8+PGNpcmNsZSBjeD0iMjkuNTQiIGN5PSIyMS43NSIgcj0iNy43NSIvPjxjaXJjbGUgY3g9IjgwLjU0IiBjeT0iMTUxLjI1IiByPSI3Ljc1Ii8+PGNpcmNsZSBjeD0iMTQ5Ljc4IiBjeT0iNjcuMjUiIHI9IjcuNzUiLz48Y2lyY2xlIGN4PSIxMDAuNzkiIGN5PSIyOS41IiByPSI3Ljc1Ii8+PGNpcmNsZSBjeD0iMzQuNzkiIGN5PSIxMTAuNSIgcj0iNy43NSIvPjwvZz48L3N2Zz4=',
      location: 'sidePanel'
    }
    const threeBox = {
      name: 'box',
      displayName: '3Box Spaces',
      description: 'A decentralized storage for everything that happen on Remix',
      methods: ['login', 'isEnabled', 'getUserAddress', 'openSpace', 'closeSpace', 'isSpaceOpened', 'getSpacePrivateValue', 'setSpacePrivateValue', 'getSpacePublicValue', 'setSpacePublicValue', 'getSpacePublicData'],
      events: [],
      version: '0.1.0-beta',
      url: 'https://remix-3box.surge.sh',
      icon: 'https://raw.githubusercontent.com/3box/3box-dapp/master/public/3Box3.png',
      location: 'sidePanel'
    }
    const remixWorkshop = {
      name: 'workshops',
      displayName: 'Remix Workshops',
      description: 'Learn Ethereum with Remix !',
      methods: [],
      events: [],
      version: '0.1.0-alpha',
      url: 'https://remix-plugin-workshops.surge.sh',
      icon: 'https://image.flaticon.com/icons/svg/1570/1570493.svg',
      location: 'sidePanel'
    }
    const debugPlugin = {
      name: 'debugPlugin',
      displayName: 'Debug Tools for Remix plugins',
      description: 'Easily test and debug your plugins !',
      methods: ['sayHello', 'sayMyName', 'sayOurNames'], // test calls with 0, 1, and 2 args
      events: [],
      version: '0.1.0-alpha',
      url: 'https://remix-debug-a.surge.sh',
      icon: 'https://remix-debug-a.surge.sh/icon.png',
      location: 'sidePanel'
    }
    const libraTools = {
      name: 'libratools',
      displayName: 'Libra and Move Tools',
      events: [],
      methods: [],
      url: 'https://libra.pipeos.one',
      description: 'Create, compile, deploy and interact with Libra modules and scripts',
      icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iMTAyNCIKICAgaGVpZ2h0PSIxMDI0IgogICB2aWV3Qm94PSIwIDAgMjcwLjkzMzMzIDI3MC45MzMzMyIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ic3ZnOCIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMC45Mi4yIDVjM2U4MGQsIDIwMTctMDgtMDYiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImxpYnJhLnN2ZyI+CiAgPGRlZnMKICAgICBpZD0iZGVmczIiIC8+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIGlkPSJiYXNlIgogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxLjAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAuMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnpvb209IjAuNzczNDM3NSIKICAgICBpbmtzY2FwZTpjeD0iNTEyIgogICAgIGlua3NjYXBlOmN5PSI1MTIiCiAgICAgaW5rc2NhcGU6ZG9jdW1lbnQtdW5pdHM9InB4IgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSIKICAgICBzaG93Z3JpZD0iZmFsc2UiCiAgICAgdW5pdHM9InB4IgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTY1MiIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDA1IgogICAgIGlua3NjYXBlOndpbmRvdy14PSIwIgogICAgIGlua3NjYXBlOndpbmRvdy15PSIxIgogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNSI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICBpbmtzY2FwZTpsYWJlbD0iTGF5ZXIgMSIKICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIgogICAgIGlkPSJsYXllcjEiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwtMjYuMDY2NzEpIj4KICAgIDxnCiAgICAgICBpZD0iZzk3MCIKICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuODQzMTI1MjMsMCwwLDAuODQzMTI1MjMsMjEuMjUxMzAxLDI1LjM0MDUxMykiPgogICAgICA8cGF0aAogICAgICAgICBzb2RpcG9kaTpub2RldHlwZXM9ImNzc2MiCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgIGlkPSJwYXRoOTQ3IgogICAgICAgICBkPSJtIDQwLjc4NjQ0MywxMDcuNzM2MTcgYyAwLDAgMTkuMzI4MzA0LC0zNi44NDk4MzEgNDguOTMwMzg1LC0zNi44NDk4MzEgMjkuNjAyMDgyLDAgNjIuODI4ODkyLDI5LjYwMjA3MSA5Mi40MzA5ODIsMjkuNjAyMDcxIDI5LjYwMjA4LDAgNDcuNzI1NzksLTM4LjY2MzkzNSA0Ny43MjU3OSwtMzguNjYzOTM1IgogICAgICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzAwMDAwMDtzdHJva2Utd2lkdGg6MjcuNDg3NjQyMjk7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4KICAgICAgPHBhdGgKICAgICAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjI3LjQ4NzY0MjI5O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICAgIGQ9Im0gNDAuNzg2NDQzLDE4NC4xNTc4NSBjIDAsMCAxOS4zMjgzMDQsLTM2Ljg0OTgyIDQ4LjkzMDM4NywtMzYuODQ5ODIgMjkuNjAyMDgsMCA2Mi44Mjg5LDI5LjYwMjA3IDkyLjQzMDk4LDI5LjYwMjA3IDI5LjYwMjA4LDAgNDcuNzI1NzksLTM4LjY2Mzk0IDQ3LjcyNTc5LC0zOC42NjM5NCIKICAgICAgICAgaWQ9InVzZTk1MSIKICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjc3NjIiAvPgogICAgICA8cGF0aAogICAgICAgICBzb2RpcG9kaTpub2RldHlwZXM9ImNzc2MiCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgIGlkPSJ1c2U5NTUiCiAgICAgICAgIGQ9Im0gNDAuNzg2NDQzLDI2MC41Nzk1NSBjIDAsMCAxOS4zMjgzMDYsLTM2Ljg0OTgzIDQ4LjkzMDM4NywtMzYuODQ5ODMgMjkuNjAyMDgsMCA2Mi44Mjg5LDI5LjYwMjA3IDkyLjQzMDk4LDI5LjYwMjA3IDI5LjYwMjA4LDAgNDcuNzI1NzksLTM4LjY2MzkzIDQ3LjcyNTc5LC0zOC42NjM5MyIKICAgICAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjI3LjQ4NzY0MjI5O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K',
      location: 'sidePanel'
    }
    const oneClickDapp = {
      name: 'oneClickDapp',
      displayName: 'One Click Dapp',
      events: [],
      methods: [],
      version: '0.1.0',
      notifications: {
        solidity: ['compilationFinished']
      },
      url: 'https://remix-one-click-dapp.surge.sh',
      description: 'A free tool to generate smart contract interfaces.',
      documentation: 'https://github.com/pi0neerpat/remix-plugin-one-click-dapp',
      icon: 'https://remix-one-click-dapp.surge.sh/icon.png',
      location: 'sidePanel'
    }
    const gasProfiler = {
      name: 'gasProfiler',
      displayName: 'Gas Profiler',
      events: [],
      methods: [],
      version: '0.1.0-alpha',
      url: 'https://remix-gas-profiler.surge.sh',
      description: 'Profile gas costs',
      icon: 'https://res.cloudinary.com/key-solutions/image/upload/v1565781702/gas-profiler_nxmsal.png',
      location: 'sidePanel'
    }
    const flattener = {
      name: 'flattener',
      displayName: 'Flattener',
      events: [],
      methods: [],
      version: '0.1.0',
      url: 'https://remix-flattener.netlify.com',
      description: 'Flattens compiled smart contracts',
      icon: 'https://remix-flattener.netlify.com/logo.svg',
      location: 'sidePanel'
    }
    const ethpm = {
      name: 'ethPM',
      displayName: 'ethPM',
      events: [],
      methods: [],
      notifications: {
        solidity: ['compilationFinished']
      },
      url: 'https://ethpm.surge.sh',
      description: 'Generate and import ethPM packages.',
      documentation: 'https://docs.ethpm.com/ethpm-developer-guide/ethpm-and-remix-ide',
      icon: 'https://ethpm.surge.sh/ethpmlogo.png',
      location: 'mainPanel'
    }
    const zokrates = {
      name: 'Zokrates',
      displayName: 'ZoKrates',
      description: 'ZoKrates will compile your program to an intermediate representation and run a trusted setup protocol to generate proving and verifying keys.',
      methods: [],
      events: [],
      version: '0.1.0-alpha',
      url: 'https://zokrates.blockchain-it.hr',
      icon: 'https://zokrates.blockchain-it.hr/zokrates.svg',
      location: 'sidePanel'
    }
    return [
      new IframePlugin(pipeline),
      new IframePlugin(vyper),
      new IframePlugin(tangerineGarden),
      new IframePlugin(ethdoc),
      new IframePlugin(mythx),
      new IframePlugin(provable),
      new IframePlugin(threeBox),
      new IframePlugin(remixWorkshop),
      new IframePlugin(debugPlugin),
      new IframePlugin(libraTools),
      new IframePlugin(oneClickDapp),
      new IframePlugin(gasProfiler),
      new IframePlugin(flattener),
      new IframePlugin(ethpm),
      new IframePlugin(zokrates)
    ]
  }
}
