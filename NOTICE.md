# Notice — Inhalte Dritter

Die [`LICENSE`](./LICENSE) dieses Repositorys deckt den Code und die Inhalte, die
von der Erwins Enkel GmbH stammen. Sie deckt **nicht** das im Folgenden benannte
Material Dritter.

## Autotask-Variablenkataloge

Betroffen:

```
psa/autotask/catalog.de.json
psa/autotask/catalog.en.json
psa/autotask/catalog.es.json
```

Diese Dateien sind generiert. `tools/build-psa-catalog.py` erzeugt sie aus den
offiziellen Variablentabellen der Autotask-Hilfe:

| Sprache | Quelle |
| ------- | ------ |
| en | `https://psa.datto.com/help/Content/5_LinkedDOCUMENTS/MSDocs/Variables_en.xlsx` |
| de | `https://ww18.autotask.net/help/Content/5_LinkedDOCUMENTS/MSDocs/Variables_de.xlsx` |
| es | `https://ww12.autotask.net/help/Content/5_LinkedDOCUMENTS/MSDocs/Variables_es.xlsx` |

Namen, Beschreibungen und die Zusammenstellung dieser Kataloge stammen von
Datto/Kaseya. Die Erwins Enkel GmbH beansprucht daran keine Rechte und lizenziert
sie nicht weiter — weder unter der `LICENSE` noch unter deren Change License.
Wer die Kataloge über die Nutzung dieser Anwendung hinaus verwenden oder
weitergeben will, klärt das mit dem Rechteinhaber.

Autotask und Datto sind Marken der Kaseya-Gruppe. Dieses Projekt steht in keiner
Verbindung zu Kaseya, Datto oder Autotask und wird von ihnen weder unterstützt
noch geprüft.

## Nicht betroffen

`psa/autotask/curated.json` fällt unter die `LICENSE`. Beschreibungen und
Beispielwerte sind eigene Texte; übernommen sind dort ausschließlich die
Variablennamen, die zur Zuordnung technisch notwendig sind.
