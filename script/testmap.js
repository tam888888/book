let r = null;
let collec = {}

let city = "Tỉnh kon tum"
let district = "huyện đắk tô thị trấn đắk tô"
let qq = "spa in " + city + " " + district
qq = encodeURIComponent(qq)

let urls = ['https://www.google.com/search?tbm=map&authuser=0&hl=en&pb=!4m12!1m3!1d83002.41826550964!2d105.74177272564789!3d21.053763740772258!2m3!1f0!2f0!3f0!3m2!1i879!2i1070!4f13.1!7i20!10b1!12m16!1m1!18b1!2m3!5m1!6e2!20e3!10b1!12b1!13b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m6!1s5rkDZckl64Pj4Q-t4IHIBQ%3A26!2s1i%3A0%2Ct%3A11887%2Cp%3A5rkDZckl64Pj4Q-t4IHIBQ%3A26!7e81!12e3!17s5rkDZckl64Pj4Q-t4IHIBQ%3A957!18e15!24m94!1m29!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m18!3b1!4b1!5b1!6b1!9b1!12b1!13b1!14b1!15b1!17b1!20b1!21b1!22b0!25b1!27m1!1b1!28b1!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i1070!1m6!1m2!1i829!2i0!2m2!1i879!2i1070!1m6!1m2!1i0!2i0!2m2!1i879!2i20!1m6!1m2!1i0!2i1050!2m2!1i879!2i1070!34m18!2b1!3b1!4b1!6b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m4!2e2!3m2!1b1!3b1!61b1!67m2!7b1!10b1!69i662&q=#QUERY&oq=#QUERY&gs_l=maps.12...0.0.9.562666.0.0.....0.0..0.....0......maps..0.0.0.0.&tch=1&ech=17&psi=5rkDZckl64Pj4Q-t4IHIBQ.1694743015587.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i20!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwiWxKOP1quBAxXOIDQIHa_KBkMQ_KkBCO0GKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwiWxKOP1quBAxXOIDQIHa_KBkMQ_KkBCO4GKBc!10m2!2m1!1e1!3m1!1u2!3m1!1u3!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=1&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i40!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwjlx7-T1quBAxXGFjQIHZMcCvUQ_KkBCPoGKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwjlx7-T1quBAxXGFjQIHZMcCvUQ_KkBCPsGKBc!10m2!2m1!1e1!3m1!1u3!3m1!1u2!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=2&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i60!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwjKjZ6V1quBAxUFKH0KHZDMDXAQ_KkBCLEGKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwjKjZ6V1quBAxUFKH0KHZDMDXAQ_KkBCLIGKBc!10m2!2m1!1e1!3m1!1u3!3m1!1u2!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=3&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i80!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwjs4eSW1quBAxUNGjQIHZZ7Bg0Q_KkBCL4GKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwjs4eSW1quBAxUNGjQIHZZ7Bg0Q_KkBCL8GKBc!10m2!2m1!1e1!3m1!1u3!3m1!1u2!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=4&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1', 'https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&pb=!4m12!1m3!1d29787.14196525961!2d105.78047905!3d21.056966000000003!2m3!1f0!2f0!3f0!3m2!1i800!2i600!4f13.1!7i20!8i100!10b1!12m34!1m1!18b1!2m3!5m1!6e2!20e3!6m16!4b1!49b1!63m0!73m0!74i150000!75b1!85b1!89b1!91b1!110m0!114b1!149b1!169b1!170i6!176f8!179f90!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m2!1sTM8DZcaUPM7B0PEPr5WbmAQ!7e81!24m91!1m26!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m15!3b1!4b1!5b1!6b1!13b1!14b1!15b1!17b1!21b1!22b0!25b1!27m1!1b0!28b0!31b0!2b1!5m5!2b1!5b1!6b1!7b1!10b1!10m1!8e3!11m1!3e1!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m17!1m5!1b1!2b1!3b1!5b1!7b1!4b1!8m8!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_reviews!9b1!89b1!103b1!113b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i600!1m6!1m2!1i750!2i0!2m2!1i800!2i600!1m6!1m2!1i0!2i0!2m2!1i800!2i20!1m6!1m2!1i0!2i580!2m2!1i800!2i600!34m19!2b1!3b1!4b1!6b1!7b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!42b1!46m1!1e1!47m0!49m7!3b1!6m2!1b1!2b1!7m2!1e3!2b1!50m25!1m21!2m7!1u3!4sOpen+now!5e1!9s0ahUKEwimoNKY1quBAxVRAjQIHS_4BHcQ_KkBCKwGKBY!10m2!3m1!1e1!2m7!1u2!4sTop+rated!5e1!9s0ahUKEwimoNKY1quBAxVRAjQIHS_4BHcQ_KkBCK0GKBc!10m2!2m1!1e1!3m1!1u3!3m1!1u2!4BIAE!2e2!3m1!3b1!59BQ2dBd0Fn!67m3!7b1!10b1!14b0!69i662&q=#QUERY&tch=1&ech=5&psi=TM8DZcaUPM7B0PEPr5WbmAQ.1694748494539.1']

for (let url of urls) {
    // console.log("offset" + url)
    let uri = url.replaceAll("#QUERY", qq);
    let aa = await fetch(uri, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7",
            "sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
            "sec-ch-ua-arch": "\"x86\"",
            "sec-ch-ua-bitness": "\"64\"",
            "sec-ch-ua-full-version": "\"115.0.5790.171\"",
            "sec-ch-ua-full-version-list": "\"Not/A)Brand\";v=\"99.0.0.0\", \"Google Chrome\";v=\"115.0.5790.171\", \"Chromium\";v=\"115.0.5790.171\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-model": "\"\"",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-ch-ua-platform-version": "\"10.0.0\"",
            "sec-ch-ua-wow64": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-client-data": "CJe2yQEIorbJAQipncoBCKOTywEIlKHLAQiFoM0BCI2nzQEI3L3NAQjfxM0BCLXFzQEIxMjNAQi5ys0BCLfNzQEIk8/NAQjU0M0B",
            "x-goog-ext-353267353-jspb": "[null,null,null,147535]",
            "x-maps-diversion-context-bin": "CAE=",
            "cookie": "HSID=AzGQQfneG9w4ZOChy; SSID=AIYD-RAtp5kcKMtNG; APISID=6PhvwY3dbnVugDJ0/AQJ2m5CTSnpuhWLVh; SAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; __Secure-1PAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; __Secure-3PAPISID=HM29REOJ5QhA7ECF/AA2zvqN4jyZy1u8_T; SID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4Jaob-MoHtQr5EyENBc1fG09Yqpv7TtSLvDSiW5rr-jNqot_aklqzTbZnADDdbG78bNH8Ruu42oSShRYDiQ6Bu3qIcG1qSAhbYxlx7oXfBqT7pWHteCDvuKTNaGjfVYGMz5NEG9njghlUO5UnNiQXbw_o-BqOHsw8nBOV0lq8y2DvHBxm4VspcNZSqTgQHtI0Y42lVWziqBoABMzg4MWE0NGU4MGUzZDkxYWZlZTcyYmYxY2RjOGJjZGIzMmZhZTQ4MWRjMTZkNzIzYjYyZDk1NDFhYmJjNWY0MmRlMDA2MGY3OWFmNWNmZTY3ZWU5MDhlNzBmODQyZTI3MDhiMmI5ZWNjZmNiMmVlZDk0MzRjNmM4YzdjMDE0ODI; __Secure-1PSID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4JaqO12s-QS4C-JrbA8Sfp2W1OPJJy8cizG1PDtqx-45Gh8XpYc_mhTQlpdd6YZa0ZmTmkIRPyo2cxxpDGANtGezLQAfE1GlMofEEyN5ckDUnsgqbmMeSjBMOPkdiq7zM2QTVxlTgniIGVWXr6Cses7UklPlVv364VzB4e38wwDt5RpnHS3Qh7s89zX7-zJt6d1AJ3pciqBoABMWYzYzBjOWY2OGJmOGQ3ZGRhM2NlZGZhYjM5MTRhN2FhYWJiN2QyZjkzMTNhN2RiNzdmYzMwNmU1MDIxNDAwYTI3MjBkNDIzZDdjZDc5YWYzNjUzNjYyMWQ1ZmE4MDhlNDI1MTg5ZjZiNDRhMzA5ZmM0NDhkMzhjZGE0OWZjNzQ; __Secure-3PSID=[SC]CgUNRT0AAJoGDENBRVFBeGlBbUFFPaIGmQEAfj4JaiAxmjWqw36O6VY3vbjMUq_mkvY14EZwjJP0VeEWAEm1rVJXOmES2VFzUkKNNURJchKOv8CtNxvtThQ8wIjMTbac6MpwZi4o8Sn5NZ5dvjWrPW3kTPQokr722NPIZT5N-2ordXfA3Ztp-guKhXj3q1dT-GOrJ8YcfbIgL0j7q8Y9oGwJRBIaM1oNT_x40LU5pXwnZ7eqBoABZjI4ZTlhY2JmYWNlYjQwYjk5OTdhY2JmMDgxZjFhYmZlZTBmNmZhNmYzMjFkZDY3NzQ1NGQyNTFmYzVhZjA1NzNiYzRhZDAyZjcyN2VlYjgyYmRiY2I5OGExOGU5ZTZjNzFiZWQ5ZWFiODkzNGM0N2U3NTA4NGI3Y2ZmNjY4MmE; SIDCC=AFvIBn8bM1avbvpGz1B7ll7mg1tZGa4X62lurkkv5vvqifTOszCus7zHlTyDYQLACjF0G4np_Z4; __Secure-1PSIDCC=AFvIBn8M-1ogJmChxA42CyK1hXOkxCdSnqVxNq7HhWxVctVmlGDS4dJrIEt-6IU-1Cbdgdiy1Ns; __Secure-3PSIDCC=AFvIBn-toKW8E_sny0gYgNaU0oYx6HLUDirFSphKBukuhlEaqSDuX8MbP019V8MDMORQ3ys2LXKR; OTZ=7204612_28_28__28_; AEC=Ad49MVE2s9j4ONAspwCutnp_tUCzsBk-kIlW_z2McSsOuNCij1QAyGwxhn4; NID=511=fVNb3VItoOew7T_5r6qIKbkDfTpJ_MYxudVYZfwGcKuAN5cdYWnTR0nzoPt-UO3dteUSiQgPnwCrElhz0vAhEASCnxpmzluRA6zcYhOD_nM2kSh-RspcAVXnOdS56dd8EHzcYm23LIToNZyG-zj6JQ7eSq923DEBaSF7Y9fOXU0lyY7d9zh0KkYEMTE9yTVSym6OL3Bh0LuG5EoXOS0bdxi93Q; 1P_JAR=2023-09-14-11",
            "Referer": "https://www.google.com/",
            "Referrer-Policy": "origin"
        },
        "body": null,
        "method": "GET"
    });


    let z = await aa.text()
    //console.log(z)
    let z4 = JSON.parse(z.slice(0, z.length - 6))
    let z5 = JSON.parse(z4.d.slice(5))
    //console.log(JSON.stringify(z5[0][1][1][14]))
    for (let i = 1; i < z5[0][1].length; i++) {
        let record = z5[0][1][i][14]
        r = record
        // console.log("i", i, record)
        let idd = { id: record[227][0][0], tel: record[178] == null ? null : record[178][0][0], spa: record[11], name: record[183] == null ? null : record[183][0][1][1][0][0], name2: record[18] }
        collec[idd.id] = idd
    }

console.log("Tong so ban ghi " + Object.keys(collec).length)
}


console.table(collec)

console.log("Tong so ban ghi " + Object.keys(collec).length)
