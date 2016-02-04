(function($) {
    $('document').ready(function() {
        var socket = io();
        var currentAnswerer = null;
        var currentQuestion = null;
        var currentCol = null;
        var currentRow = null;
        socket.emit("admin_joined");
        socket.emit("get_question_data");

        socket.on("question_data_received", function(data) {
            for (var i = 0; i < data.questions.length; i++) {
                var questions = data.questions[i].vals;
                for (var x = 0; x < questions.length; x++) {
                    var element = $('#question-'+i+'-'+x+ ' > a');
                    element.data('jeopardy-value', data.questions[x].vals[i].points);
                    element.data('jeopardy-question', data.questions[x].vals[i].question);
                    element.data('jeopardy-answer', data.questions[x].vals[i].answer);
                    element.text(data.questions[x].vals[i].points);
                }
            }
        });

        socket.on("answerer_selected", function(name, col, question) {
           //Show the name in the label
            $('span.current_answerer').text(name);
            $('#answerer').val(name);
            currentAnswerer = name;
            currentCol = col;
            currentRow = question;
            $('#question-'+col+'-'+question+ ' > a').trigger('click');
        });

        $('#open-question-button').click(function(e) {
            e.preventDefault();
            $(this).addClass('btn-danger').removeClass('btn-successs');
            socket.emit("set_questions_open");
        });

        $('#reset-answerer-button').click(function(e) {
            e.preventDefault();
            socket.emit("reset_answerer");
        });

        $('#questionanswerholder').on('show.bs.modal', function (e) {
            var modal = $(this);
            var a = $(e.relatedTarget);

            currentQuestion = a;

            var answerText = modal.find("p.answer");
            answerText.text(a.data('jeopardy-answer'));

            var questionText = modal.find("p.question");
            questionText.text(a.data('jeopardy-question'));

            var pointValue = modal.find("input#point-value");
            pointValue.val(a.data('jeopardy-value'));

            var date = new Date();
            date.setSeconds(date.getSeconds() + 20);
            $('#clock').countdown(date, function(event) {
                console.log(event.type);
                $(this).html(event.strftime('%S'));

                if(event.type==="finish") {
                    new Audio('/audio/time.mp3').play()
                }
            });

        }).on('hide.bs.modal', function(e) {
            var modal = $(this);
            var pointValue = modal.find("input#point-value");
            pointValue.val(0);
            $(".question-container").removeClass("animate flipInY").addClass("hidden");
            $(".answer-container").removeClass("animated flipOutY");
        });

        $('.answer-container').click(function(e){
            $(this).addClass("animated flipOutY");
            $(".question-container").removeClass("hidden").addClass("animated flipInY");
        });

        $("#doScore").submit(function( event ) {
            event.preventDefault();

             var results = $(this).serializeArray();

            socket.emit("question_answered", results, currentAnswerer, currentQuestion.data(), currentCol, currentRow);
            $('span.current_answerer').text("");
            currentAnswerer = null;
            currentCol = null;
            currentRow = null;
            $('#answerer').val("");

            $('#questionanswerholder').modal("hide");
            $(currentQuestion).parent().addClass("disabled");
            currentQuestion = null;
        });


    });
})(jQuery);