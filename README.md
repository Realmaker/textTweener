# textTweener
A jQuery Plugin to generate animation tweens between different texts

With textTweener you can generate a text rotator to your page. The different texts fade nicely into each other by moving the letters to their new position. 

Include the js file in the header or the footer of your page:
<tt><script src="jquery-textTweener.min.js"></script></tt>

Then add a div with the containing textelements to the body of your page:
<div id="texttween">
<span class="text">This is a very long sample text with a lot of words to test the function of TextTweener.</span>
<span class="text">The second text will then be created smoothly with the letters from the first text.</span>
<span class="text">And after that there is a third text to watch the transition again.</span>
<span class="text">If you like, you can change the duration of one text by using the option duration.</span>
</div>

Finally, you start the Tweening Function by connecting TextTweener to the parent div:
<script>
$("#texttween").TextTweener({
	duration: "5000"
});
</script>

Duration is optional, standard is 5000ms.
