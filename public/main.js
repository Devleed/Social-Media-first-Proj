$(document).ready(()=>{
    $(".delete-post").on("click",(e)=>{
        $target = $(e.target);
        const id = $target.attr('dataid');
        console.log(id);
        $.ajax({
            type:'DELETE',
            url:'/post/'+id,
            success:function(response){
                alert('Deleting Post');
                window.location.href='/';
            },
            error: function(err){
                console.log(err);
              }
        });
    });
});