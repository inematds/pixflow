# Exemplo 2: "A Chama do Saber" (história 100% nova, gerada com a skill)

Validação da `pixflow-trailer` partindo de **um pitch** (não de uma decupagem pronta): *"um dragão inteligente de óculos buscando salvar um reino de dragões dos dragões maus"*. A skill inventou a história e montou ~51 shots.

## História
No reino flutuante de **Aurális**, **Vendric** — um jovem dragão míope de óculos, mais leitor que guerreiro — descobre uma profecia quando os **Dragões das Cinzas**, liderados por **Mordrax**, invadem para queimar a Grande Biblioteca. Sem garras para a luta, Vendric vence pela **mente** (estratégia + um feixe de luz refletido num cristal) e une os dragões.

## Resultado
- **51 cenas, ~1:25**, 1280×720. `dragao-trailer.mp4` (música) e `dragao-trailer-narrado.mp4` (narração masculina).
- Saída em `~/projetos/output/dragao-trailer/`.

## O que valida
- A `inteligencia-direcao.md` aplicada a um gênero novo (fantasia/dragões): closes `push_in` sutil no Vendric, `crane`/`aerial` no reino, `handheld` na batalha aérea, `crash_zoom` nos impactos, `dip_to_black` nas cartelas.
- O mesmo pipeline de áudio/narração (trilha royalty-free reaproveitada + braam nos marcos + narração nos vãos).
- Prompt difícil ("dragão de óculos") saiu consistente no flux2-klein graças à descrição fixa do personagem reusada em cada shot.
