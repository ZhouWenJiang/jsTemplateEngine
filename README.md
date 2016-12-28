# jsTemplateEngine
提供一套模板语法，用户可以写一个模板区块，每次根据传入的数据，
生成对应数据产生的HTML片段，渲染不同的效果。

##使用实例
###HTML代码
<div id="container">
	<p>All info</p>
	<ul>
		<li for="users as user i" id="{user.userId}"><span>{user.name}-{user.age}-{user.sex}</span></li>
	</ul>
	<p>Men</p>
	<ul>
		<li for="users as user i" id="{user.userId}" if="user.sex">
			<span >{user.name}-{user.age}-{user.sex}</span>
		</li>
	</ul>
	
	<p>Women</p>
	<ul>
		<li for="users as user i" id="{user.userId}" if="!user.sex">
			{user.name}-{user.age}-{user.sex}
		</li>
	</ul>
</div>
###JS代码
var data={users:[{"name":"zero",age:33,sex:0},{"name":"gray",age:12,sex:0},
		{"name":"zak",age:33,sex:1},{"name":"cui",age:33,sex:1},
		]}
render("container",data);//container为要将数据加载到的元素的id	