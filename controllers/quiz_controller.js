var models = require('../models/models.js');

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
  models.Quiz.find({
            where: {
                id: Number(quizId)
            },
            include: [{
                model: models.Comment
            }]
        }).then(function(quiz) {
      if (quiz) {
        req.quiz = quiz;
        next();
      } else { next(new Error('No existe quizId=' + quizId)); }
    }
  ).catch(function(error) { next(error);});
};

// GET /quizes
exports.index = function(req, res) {
  if(req.query.search){
    var search = "%"+req.query.search+"%";
    search = search.replace(" ","%").toLowerCase();
  //  var search = "%"+req.query.buscar.replace(" ","%")+"%";
    models.Quiz.findAll({where: ["lower(pregunta) like ?", search], order: 'pregunta ASC'}).then(
      function(quizes) {
        res.render('quizes/index', { quizes: quizes, errors: [] });
      } 
    ).catch(function(error) { next(error);});
  }else{
   models.Quiz.findAll().then(
    function(quizes) {
      res.render('quizes/index', { quizes: quizes, errors: [] });
    }
    ).catch(function(error) { next(error);});
  }
};

// GET /quizes/statistics
exports.statistics = function(req, res) {
var numPreguntas = 0;
var numComentariosMedio = 0;
var pregConComentarios = 0;
   models.Quiz.count().then(
   function(numPreguntas1) {
      numPreguntas = numPreguntas1;
      return models.Comment.count();
   }).then(
    function(comentariosTotal1) {
      comentariosTotal = comentariosTotal1;
      return models.Comment.preguntasConComentarios();
   }).then(
   function(pregConComentarios1) {
      pregConComentarios = pregConComentarios1;
   }).catch(
     function(error) { next(error);
   }).finally(function() {
     res.render('statistics', { numPreguntas: numPreguntas, comentariosTotal: comentariosTotal, pregConComentarios: pregConComentarios, errors: [] });
   });
};

// GET /quizes/:id
exports.show = function(req, res) {
  res.render('quizes/show', { quiz: req.quiz, errors: [] });
};

// GET /quizes/:id/answer
exports.answer = function(req, res) {
  var resultado = 'Incorrecto';
  if (req.query.respuesta.toLowerCase() === req.quiz.respuesta.toLowerCase()) {
    resultado = 'Correcto';
  }
  res.render('quizes/answer', { quiz: req.quiz, respuesta: resultado, errors: [] });
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
  var quiz = req.quiz;  // req.quiz: autoload de instancia de quiz

  res.render('quizes/edit', {quiz: quiz, errors: []});
};

// GET /quizes/new
exports.new = function(req, res) {
	var quiz = models.Quiz.build( 	// crea el objeto quiz
		{ pregunta: "Pregunta", respuesta: "Respuesta", tema: "Tema" }
	);
	res.render('quizes/new', { quiz: quiz, errors: [] });
};

// GET /author
exports.author = function(req, res){
	res.render('author', { errors: [] });
};

// POST /quizes/create
exports.create = function(req, res) {
  var quiz = models.Quiz.build(req.body.quiz);
  quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/new', {quiz: quiz, errors: err.errors});
      } else {
        quiz // save: guarda en DB campos pregunta y respuesta de quiz
        .save({fields: ["pregunta", "respuesta", "tema"]})
        .then( function(){ res.redirect('/quizes')}) 
      }      // res.redirect: Redirección HTTP a lista de preguntas
    }
  ).catch(function(error){next(error)});
};

// PUT /quizes/:id
exports.update = function(req, res) {
  req.quiz.pregunta  = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;
  req.quiz.tema = req.body.quiz.tema;

  req.quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
      } else {
        req.quiz     // save: guarda campos pregunta y respuesta en DB
        .save( {fields: ["pregunta", "respuesta", "tema"]})
        .then( function(){ res.redirect('/quizes');});
      }     // Redirección HTTP a lista de preguntas (URL relativo)
    }
  ).catch(function(error){next(error)});
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
  req.quiz.destroy().then( function() {
    res.redirect('/quizes');
  }).catch(function(error){next(error)});
};
