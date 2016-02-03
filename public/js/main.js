(function($) {

    var socket = io();
    var currentQuestion = null;

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

        var correct = parseInt(results[1].value);
        var span = $('#team-score-'+results[0].value).find('span');
        var currentScore = parseInt(span.text());

        if(correct==1) {
            currentScore+=parseInt(results[2].value);
        } else if(correct==0) {
            currentScore-=parseInt(results[2].value);
        }

        span.text(currentScore);


        $('#questionanswerholder').modal("hide");
        $(currentQuestion).parent().addClass("disabled");
        currentQuestion = null;
    });


})(jQuery);